"""Relax knowledge API served in-process by the Coach FastAPI gateway."""
from __future__ import annotations

import asyncio
import json
import os
import re
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx
import yaml
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse


def create_router(data_dir: Path) -> APIRouter:
    router = APIRouter()
    db_path = data_dir / "kb.db"
    cache_path = data_dir / "cache.db"
    home = Path.home()
    vault_paths = [
        home / "Vitaltrainer/Sportkompetenz/Endokrinologie",
        home / "Vitaltrainer/Sportkompetenz/Biochemie",
        home / "Vitaltrainer/Sportkompetenz/Biochemie/Supplemente",
        home / "Vitaltrainer/Sportkompetenz/Physiologie",
        home / "Vitaltrainer/Dipl.Entspannungstrainer",
        home / "BODY/Kräuter",
        home / "physiologie",
    ]

    def connect(path: Path) -> sqlite3.Connection:
        con = sqlite3.connect(path, timeout=5)
        con.row_factory = sqlite3.Row
        return con

    def decoded(value: Any, fallback: Any) -> Any:
        if value is None:
            return fallback
        try:
            return json.loads(value)
        except (TypeError, json.JSONDecodeError):
            return fallback

    def cache_get(key: str) -> Any:
        if not cache_path.exists(): return None
        with connect(cache_path) as con:
            row=con.execute("SELECT data,cached_at,ttl FROM external_cache WHERE key=?",(key,)).fetchone()
        if not row or int(time.time())-row["cached_at"]>row["ttl"]: return None
        return decoded(row["data"],None)

    def cache_set(key: str, value: Any, source: str, ttl: int = 604800) -> None:
        cache_path.parent.mkdir(parents=True,exist_ok=True)
        with connect(cache_path) as con:
            con.execute("INSERT OR REPLACE INTO external_cache(key,source,data,cached_at,ttl) VALUES(?,?,?,?,?)",
                        (key,source,json.dumps(value,ensure_ascii=False),int(time.time()),ttl))

    def save_enriched(key: str, value: Any, source: str) -> None:
        cache_path.parent.mkdir(parents=True,exist_ok=True)
        with connect(cache_path) as con:
            con.execute("INSERT OR REPLACE INTO enriched_molecules(mol_key,data,source,fetched_at) VALUES(?,?,?,?)",
                        (key,json.dumps(value,ensure_ascii=False),source,int(time.time())))

    def get_enriched(key: str) -> Any:
        if not cache_path.exists(): return None
        with connect(cache_path) as con:
            row=con.execute("SELECT data FROM enriched_molecules WHERE mol_key=?",(key,)).fetchone()
        return decoded(row["data"],None) if row else None

    async def fetch_json(client: httpx.AsyncClient, url: str) -> Any:
        response=await client.get(url)
        if not response.is_success: return None
        return response.json()

    async def enrich_pubchem(name: str, client: httpx.AsyncClient) -> dict[str,Any] | None:
        cid_key=f"pubchem:cid:{name.lower()}"; cid=cache_get(cid_key)
        if cid is None:
            data=await fetch_json(client,f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{quote(name)}/cids/JSON")
            cid=(data or {}).get("IdentifierList",{}).get("CID",[None])[0]
            cache_set(cid_key,cid,"pubchem",2592000)
        if not cid: return None
        prop_url=(f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/"
                  "MolecularFormula,MolecularWeight,IUPACName,IsomericSMILES,XLogP,HBondDonorCount,HBondAcceptorCount/JSON")
        props=cache_get(f"pubchem:props:{cid}")
        if props is None:
            pdata=await fetch_json(client,prop_url); props=((pdata or {}).get("PropertyTable",{}).get("Properties") or [None])[0]
            if props is not None: cache_set(f"pubchem:props:{cid}",props,"pubchem",2592000)
        pharma=cache_get(f"pubchem:pharma:{cid}")
        if pharma is None:
            pdata=await fetch_json(client,f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/description/JSON")
            descriptions=[x.get("Description") for x in (pdata or {}).get("InformationList",{}).get("Information",[]) if x.get("Description")]
            pharma=max(descriptions,key=len) if descriptions else None
            cache_set(f"pubchem:pharma:{cid}",pharma,"pubchem",2592000)
        return {"cid":cid,"formula":(props or {}).get("MolecularFormula"),"molecular_weight":(props or {}).get("MolecularWeight"),
                "smiles":(props or {}).get("IsomericSMILES"),"iupac":(props or {}).get("IUPACName"),"xlogp":(props or {}).get("XLogP"),
                "pharmacology":pharma,"source":"pubchem","fetched_at":datetime.now(timezone.utc).isoformat()}

    async def enrich_kegg(name: str, client: httpx.AsyncClient) -> dict[str,Any] | None:
        key=f"kegg:cid:{name.lower()}"; cid=cache_get(key)
        if cid is None:
            response=await client.get(f"https://rest.kegg.jp/find/compound/{quote(name)}")
            cid=response.text.strip().splitlines()[0].split("\t")[0] if response.is_success and response.text.strip() else None
            cache_set(key,cid,"kegg",2592000)
        if not cid: return None
        pkey=f"kegg:pathways:{cid}"; pathway_ids=cache_get(pkey)
        if pathway_ids is None:
            response=await client.get(f"https://rest.kegg.jp/link/pathway/{cid}")
            pathway_ids=[line.split("\t")[1] for line in response.text.splitlines() if "\t" in line] if response.is_success else []
            cache_set(pkey,pathway_ids,"kegg",2592000)
        names=[]
        if pathway_ids:
            response=await client.get("https://rest.kegg.jp/list/"+"+".join(pathway_ids[:10]))
            if response.is_success:
                names=[line.split("\t",1)[1].strip() for line in response.text.splitlines() if "\t" in line]
        return {"kegg_id":cid,"pathway_count":len(pathway_ids),"pathways":names[:8],"source":"kegg","fetched_at":datetime.now(timezone.utc).isoformat()}

    async def enrich_psychonaut(name: str, client: httpx.AsyncClient) -> Any:
        cache_key=f"psychonaut:timing:{name.lower()}"; cached=cache_get(cache_key)
        if cached is not None: return cached
        query='''query SubstanceTiming($name: String!) { substances(query: $name) { name roas { name dose { units threshold light { min max } common { min max } strong { min max } } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } } } }'''
        try:
            response=await client.post("https://api.psychonautwiki.org",json={"query":query,"variables":{"name":name}})
            subs=(response.json().get("data") or {}).get("substances") or []
            if not subs: cache_set(cache_key,None,"psychonaut",604800); return None
            roa=next((r for r in subs[0].get("roas",[]) if r.get("name","").lower()=="oral"),None) or (subs[0].get("roas") or [None])[0]
            if not roa: return None
            def fmt(value):
                if not value or (value.get("min") is None and value.get("max") is None): return None
                return {"min":value.get("min"),"max":value.get("max"),"units":value.get("units") or "minutes"}
            duration=roa.get("duration") or {}
            result={"roa":roa.get("name"),**{k:fmt(duration.get(k)) for k in ("onset","comeup","peak","offset","total","afterglow")},"dose":roa.get("dose")}
            cache_set(cache_key,result,"psychonaut",604800); return result
        except (httpx.HTTPError,ValueError): return None

    async def gemini(prompt: str) -> str | None:
        key=os.getenv("GEMINI_API_KEY")
        if not key: return None
        model=os.getenv("GEMINI_MODEL","gemini-2.5-flash")
        async with httpx.AsyncClient(timeout=60,trust_env=False) as client:
            response=await client.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key":key},json={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"temperature":0.2}})
            if not response.is_success: return None
            parts=(response.json().get("candidates") or [{}])[0].get("content",{}).get("parts",[])
            return "\n".join(p.get("text","") for p in parts if p.get("text")) or None

    def upsert_molecule(key: str, data: dict[str,Any], source: str, needs_review: bool = False) -> bool:
        if not db_path.exists(): return False
        index_fields=("name","de_name","category","relaxation_relevance","tags","found_in")
        detail={k:v for k,v in data.items() if k not in set(index_fields)|{"_source","_created_at","_metadata"}}
        index={k:data[k] for k in index_fields if k in data}
        detail["sources"]=[source]; detail["needs_review"]=needs_review
        now=datetime.now(timezone.utc).isoformat()
        with connect(db_path) as con:
            con.execute("""INSERT INTO molecules(key,name,de_name,category,relaxation_relevance,tags,found_in,curated)
                VALUES(?,?,?,?,?,?,?,0) ON CONFLICT(key) DO UPDATE SET name=excluded.name,de_name=excluded.de_name,
                category=excluded.category,relaxation_relevance=excluded.relaxation_relevance,tags=excluded.tags,found_in=excluded.found_in
                WHERE molecules.curated=0""",(key,index.get("name",key),index.get("de_name"),index.get("category"),index.get("relaxation_relevance"),
                json.dumps(index.get("tags",[])),json.dumps(index.get("found_in",[]))))
            exists=con.execute("SELECT curated FROM molecules WHERE key=?",(key,)).fetchone()
            if not exists or exists["curated"]: return False
            known={"formula","functions","primary_effects","affects","notes","kegg_id","pubchem_cid","sources","enriched_at","needs_review"}
            extra={k:v for k,v in detail.items() if k not in known}
            con.execute("""INSERT INTO molecule_details(key,formula,functions,primary_effects,affects,notes,extra,kegg_id,pubchem_cid,sources,enriched_at,needs_review)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET formula=excluded.formula,functions=excluded.functions,
                primary_effects=excluded.primary_effects,affects=excluded.affects,notes=excluded.notes,extra=excluded.extra,kegg_id=excluded.kegg_id,
                pubchem_cid=excluded.pubchem_cid,sources=excluded.sources,enriched_at=excluded.enriched_at,needs_review=excluded.needs_review""",
                (key,detail.get("formula"),json.dumps(detail.get("functions",[])),json.dumps(detail.get("primary_effects",{})),
                 json.dumps(detail.get("affects",[])),detail.get("notes"),json.dumps(extra),detail.get("kegg_id"),detail.get("pubchem_cid"),
                 json.dumps(detail.get("sources",[source])),now,int(needs_review)))
        return True

    def all_molecules() -> dict[str, dict[str, Any]]:
        if not db_path.exists():
            return {}
        with connect(db_path) as con:
            rows = con.execute("""SELECT m.*, d.formula,d.functions,d.primary_effects,d.affects,
                d.notes,d.extra,d.kegg_id,d.pubchem_cid,d.enriched_at,d.needs_review
                FROM molecules m LEFT JOIN molecule_details d ON m.key=d.key""").fetchall()
        out = {}
        for r in rows:
            mol = {"_key": r["key"], "name": r["name"], "de_name": r["de_name"],
                   "category": r["category"], "relaxation_relevance": r["relaxation_relevance"],
                   "tags": decoded(r["tags"], []), "found_in": decoded(r["found_in"], []),
                   "_curated": bool(r["curated"])}
            if r["formula"] is not None:
                mol.update(formula=r["formula"], functions=decoded(r["functions"], []),
                           primary_effects=decoded(r["primary_effects"], {}),
                           affects=decoded(r["affects"], []))
                if r["notes"]: mol["notes"] = r["notes"]
                if r["kegg_id"]: mol["kegg_id"] = r["kegg_id"]
                if r["pubchem_cid"]: mol["pubchem_cid"] = r["pubchem_cid"]
                if r["enriched_at"]: mol["_enriched_at"] = r["enriched_at"]
                mol.update(decoded(r["extra"], {}))
            out[r["key"]] = mol
        return out

    def all_substances() -> dict[str, dict[str, Any]]:
        if not db_path.exists():
            return {}
        with connect(db_path) as con:
            rows = con.execute("""SELECT s.*,d.source_plant,d.common_names,d.description,
                d.traditional_use,d.mechanism,d.notes,d.vault_file,d.extra,d.enriched_at
                FROM substances s LEFT JOIN substance_details d ON s.key=d.key""").fetchall()
        out = {}
        for r in rows:
            sub = {"_key": r["key"], "name": r["name"], "de_name": r["de_name"],
                   "category": r["category"], "relaxation_relevance": r["relaxation_relevance"],
                   "references": decoded(r["molecule_refs"], []), "_curated": bool(r["curated"])}
            if r["source_plant"] is not None:
                sub.update(source_plant=r["source_plant"], common_names=decoded(r["common_names"], []),
                           description=r["description"], traditional_use=decoded(r["traditional_use"], []),
                           mechanism=r["mechanism"], notes=r["notes"])
                if r["vault_file"]: sub["vault_file"] = r["vault_file"]
                sub.update(decoded(r["extra"], {}))
            out[r["key"]] = sub
        return out

    def all_interactions() -> dict[str, dict[str, Any]]:
        if not db_path.exists():
            return {}
        with connect(db_path) as con:
            return {r["key"]: decoded(r["data"], {}) for r in con.execute("SELECT key,data FROM interactions")}

    def all_reactions() -> dict[str, Any]:
        if not db_path.exists():
            return {}
        with connect(db_path) as con:
            return {r["key"]: decoded(r["data"], {}) for r in con.execute("SELECT key,data FROM reactions")}

    def resolve(items: dict[str, dict[str, Any]], query: str) -> tuple[str | None, dict[str, Any] | None]:
        q = query.lower()
        for key, item in items.items():
            if q in (key.lower(), str(item.get("name") or "").lower(), str(item.get("de_name") or "").lower()):
                return key, item
        return None, None

    def get_interaction(a: str, b: str) -> dict[str, Any] | None:
        if not db_path.exists(): return None
        with connect(db_path) as con:
            row = con.execute("SELECT data FROM interactions WHERE key IN (?,?) LIMIT 1",
                              (f"{a}_{b}", f"{b}_{a}")).fetchone()
        return decoded(row["data"], None) if row else None

    def search_items(table: str, detail_table: str, query: str) -> dict[str, dict[str, Any]]:
        if not db_path.exists(): return {}
        like = f"%{query.lower()}%"
        if table == "molecules":
            rows = [k for k,v in all_molecules().items()
                    if any(query.lower() in str(v.get(f) or "").lower() for f in ("_key","name","de_name","category"))]
        else:
            rows = [k for k,v in all_substances().items()
                    if any(query.lower() in str(v.get(f) or "").lower() for f in ("_key","name","de_name","category","description"))]
        items = all_molecules() if table == "molecules" else all_substances()
        return {k: items[k] for k in rows}

    def expand_substance(query: str) -> dict[str, Any] | None:
        substances, molecules = all_substances(), all_molecules()
        key, sub = resolve(substances, query)
        if not sub: return None
        refs = sub.get("references") or []
        mols = [molecules[x] for x in refs if x in molecules]
        interactions = []
        for i, a in enumerate(refs):
            for b in refs[i+1:]:
                item = get_interaction(a,b)
                if item and item not in interactions: interactions.append(item)
        endogenous = {"neurotransmitter","hormone","amino_acid","mineral","cytokine","neuropeptide","nucleoside"}
        targets: dict[str, dict[str, Any]] = {}
        for mol in mols:
            for target, effect in (mol.get("primary_effects") or {}).items():
                target_key, target_mol = resolve(molecules, target)
                if not target_mol or target_mol.get("category") not in endogenous: continue
                targets.setdefault(target_key, {**target_mol,"via":[]})["via"].append({
                    "mol_key":mol.get("_key"),"mol_name":mol.get("de_name") or mol.get("name"),
                    "direction":effect.get("direction") if isinstance(effect,dict) else None,
                    "mechanism":effect.get("mechanism") if isinstance(effect,dict) else None})
        return {"type":"substance_expansion","substance":sub,"molecules":mols,
                "targets":list(targets.values()),"interactions":interactions,
                "molecule_count":len(mols),"interaction_count":len(interactions),"target_count":len(targets)}

    def expand_molecule(query: str) -> dict[str, Any] | None:
        molecules, substances = all_molecules(), all_substances()
        key, molecule = resolve(molecules, query)
        if not molecule: return None
        found = [substances[k] for k in molecule.get("found_in",[]) if k in substances]
        related = []
        for other_key, other in molecules.items():
            if other_key == key: continue
            inter = get_interaction(key,other_key)
            if inter: related.append({**other,"_key":other_key,"interaction_type":inter.get("type")})
        return {"type":"molecule_expansion","molecule":molecule,"found_in_substances":found,
                "related_molecules":related,"substance_count":len(found),"related_count":len(related)}

    def hub(query: str) -> dict[str, Any] | None:
        molecules, substances = all_molecules(), all_substances()
        key, target = resolve(molecules, query)
        if not target: return None
        affecting_molecules=[]
        for other_key,mol in molecules.items():
            if other_key==key: continue
            effects=mol.get("primary_effects") or {}
            if key in effects or key in (mol.get("affects") or []):
                affecting_molecules.append({**mol,"_key":other_key,"effect":effects.get(key)})
        affecting_substances=[]; seen=set()
        for mol in affecting_molecules:
            for sub_key,sub in substances.items():
                if sub_key not in seen and mol["_key"] in (sub.get("references") or []):
                    affecting_substances.append({**sub,"_key":sub_key,"via_molecule":mol["_key"]}); seen.add(sub_key)
        related=[]
        for other_key,mol in molecules.items():
            if other_key==key: continue
            inter=get_interaction(key,other_key)
            if inter: related.append({**mol,"_key":other_key,"interaction":inter})
        return {"type":"molecule_hub","hub":{**target,"_key":key},
                "affecting_substances":affecting_substances,"affecting_molecules":affecting_molecules,
                "related_molecules":related}

    def network() -> dict[str, Any]:
        molecules, interactions=all_molecules(),all_interactions()
        nodes=[{"_key":k,"name":v.get("de_name") or v.get("name"),"category":v.get("category"),
                "tags":v.get("tags") or [],"relaxation_relevance":v.get("relaxation_relevance")}
               for k,v in molecules.items()]
        edges=[]; seen=set()
        for inter in interactions.values():
            pair=inter.get("molecules") or []
            if len(pair)<2 or pair[0] not in molecules or pair[1] not in molecules: continue
            ident=f"{pair[0]}__{pair[1]}"
            if ident not in seen:
                seen.add(ident); edges.append({"id":ident,"source":pair[0],"target":pair[1],"type":inter.get("type"),"label":inter.get("type")})
        for mol_key,mol in molecules.items():
            for target,effect in (mol.get("primary_effects") or {}).items():
                if target not in molecules: continue
                ident=f"{mol_key}__{target}__fx"
                if ident not in seen:
                    seen.add(ident); direction=effect.get("direction") if isinstance(effect,dict) else None
                    edges.append({"id":ident,"source":mol_key,"target":target,"type":"primary_effect","direction":direction,"label":direction})
        return {"nodes":nodes,"edges":edges,"molecule_count":len(nodes),"edge_count":len(edges)}

    @router.get("/substances")
    def substances():
        values=all_substances(); return {"ok":True,"count":len(values),"substances":values}

    @router.get("/molecules")
    def molecules():
        values=all_molecules(); return {"ok":True,"count":len(values),"molecules":values}

    @router.get("/reactions")
    def reactions():
        values=all_reactions(); return {"ok":True,"count":len(values),"reactions":values}

    @router.get("/interactions")
    def interactions():
        values=all_interactions(); return {"ok":True,"count":len(values),"interactions":values}

    @router.get("/substance/{key}")
    def substance(key: str):
        _,value=resolve(all_substances(),key); return {"ok":bool(value),"substance":value}

    @router.get("/reaction/{key}")
    def reaction(key: str):
        value=all_reactions().get(key); return {"ok":bool(value),"reaction":value}

    @router.get("/expand")
    def dispatch(q: str | None = None):
        if not q: raise HTTPException(400,detail={"ok":False,"error":"query parameter 'q' required"})
        _,sub=resolve(all_substances(),q); _,mol=resolve(all_molecules(),q)
        if sub: result={"matched_type":"substance","data":expand_substance(q)}
        elif mol: result={"matched_type":"molecule","data":expand_molecule(q)}
        else: result={"matched_type":None,"data":None,"suggestion":f"No substance or molecule found matching: {q}"}
        return {"ok":bool(result.get("data")),"query":q,**result}

    @router.get("/expand/substance/{key}")
    def expand_sub(key: str):
        value=expand_substance(key)
        return {"ok":bool(value),**(value or {"error":f'Substance "{key}" not found'})}

    @router.get("/expand/molecule/{key}")
    def expand_mol(key: str):
        value=expand_molecule(key)
        return {"ok":bool(value),**(value or {"error":f'Molecule "{key}" not found'})}

    @router.get("/molecule/{key}/related-interactions")
    def related(key: str):
        _,mol=resolve(all_molecules(),key)
        if not mol: raise HTTPException(404,detail={"ok":False,"error":f'Molecule "{key}" not found. Generate it first.'})
        generated=[]
        return {"ok":True,"molecule":key,"interactions_generated":0,"generated_interactions":generated}

    @router.get("/enrich/{key}")
    async def raw_enrichment(key: str):
        cached = get_enriched(key)
        if cached:
            return {"ok": True, "id": key, "source": "cache", "enrichment": cached}
        molecules = all_molecules()
        molecule = molecules.get(key)
        query = (molecule or {}).get("name") or key.replace("_", " ")
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, trust_env=False) as client:
            pubchem, psychonaut = await asyncio.gather(
                enrich_pubchem(query, client), enrich_psychonaut(query, client),
                return_exceptions=True)
        pubchem = pubchem if isinstance(pubchem, dict) else None
        psychonaut = psychonaut if isinstance(psychonaut, dict) else None
        enrichment = {"pubchem": pubchem, "psychonaut": psychonaut,
                      "enriched_at": datetime.now(timezone.utc).isoformat()}
        if pubchem or psychonaut:
            save_enriched(key, enrichment, "pubchem+psychonaut")
        return {"ok": bool(pubchem or psychonaut), "id": key,
                "source": "live", "enrichment": enrichment}

    @router.post("/enrich")
    async def enrich(payload: dict[str, Any]):
        query = str(payload.get("query") or "").strip()
        mode = payload.get("mode", "dry_run")
        if not query:
            raise HTTPException(400, detail={"ok": False, "error": "query required"})
        if mode not in ("dry_run", "commit"):
            raise HTTPException(400, detail={"ok": False, "error": "mode must be dry_run or commit"})
        _, existing = resolve(all_molecules(), query)
        _, existing_substance = resolve(all_substances(), query)
        if (existing or existing_substance) and mode != "commit":
            return {"ok": True, "query": query, "source": "kb",
                    "data": existing or existing_substance, "already_in_kb": True}
        async with httpx.AsyncClient(timeout=20, follow_redirects=True, trust_env=False) as client:
            pubchem, psychonaut, kegg = await asyncio.gather(
                enrich_pubchem(query, client), enrich_psychonaut(query, client),
                enrich_kegg(query, client), return_exceptions=True)
        pubchem = pubchem if isinstance(pubchem, dict) else None
        psychonaut = psychonaut if isinstance(psychonaut, dict) else None
        kegg = kegg if isinstance(kegg, dict) else None
        sources = [name for name, value in (("pubchem", pubchem), ("psychonaut", psychonaut), ("kegg", kegg)) if value]
        if not sources:
            raise HTTPException(422, detail={"ok": False, "query": query,
                "errors": ["No enrichment source returned data"], "sources": sources})
        prompt = ("Return only valid YAML for a Relax knowledge base molecule. Include name, de_name, category, "
                  "formula, functions, primary_effects, affects, relaxation_relevance, tags, found_in, notes. "
                  "Use only evidence from this data; use null/empty values when unknown.\n"
                  f"Query: {query}\nPubChem: {json.dumps(pubchem, ensure_ascii=False)}\n"
                  f"Psychonaut: {json.dumps(psychonaut, ensure_ascii=False)}\nKEGG: {json.dumps(kegg, ensure_ascii=False)}")
        generated = await gemini(prompt)
        try:
            data = yaml.safe_load(generated) if generated else None
        except yaml.YAMLError:
            data = None
        if not isinstance(data, dict) or not data.get("name") or not data.get("category"):
            raise HTTPException(422, detail={"ok": False, "query": query,
                "errors": ["Gemini unavailable or returned invalid KB YAML"], "sources": sources})
        data.update({k: v for k, v in (pubchem or {}).items() if k in ("formula", "pubchem_cid") and v})
        if kegg and kegg.get("kegg_id"):
            data["kegg_id"] = kegg["kegg_id"]
        key = re.sub(r"\s+", "_", query.lower())
        committed = mode == "commit" and upsert_molecule(key, data, "pipeline", needs_review=True)
        return {"ok": True, "query": query, "mode": mode, "committed": committed,
                "molecule": data, "data": data, "sources": sources, "saved": committed}

    @router.get("/molecule/{key}")
    def molecule(key: str):
        _,value=resolve(all_molecules(),key)
        if value: return {"ok":True,"molecule":value,"source":value.get("_source","manual"),"confidence":"high","saved":True}
        raise HTTPException(404,detail={"ok":False,"error":f'Konnte "{key}" nicht generieren',"errors":["no offline enrichment result"],"sources_tried":[]})

    @router.get("/search")
    def search(q: str | None = None):
        if not q: raise HTTPException(400,detail={"ok":False,"error":"query parameter 'q' required"})
        subs=search_items("substances","substance_details",q); mols=search_items("molecules","molecule_details",q)
        result={"substances":[{"_key":k,**v} for k,v in subs.items()],"molecules":[{"_key":k,**v} for k,v in mols.items()]}
        return {"ok":True,"query":q,"total_count":len(subs)+len(mols),**result}

    @router.get("/interaction")
    def interaction(mol1: str | None = None,mol2: str | None = None):
        if not mol1 or not mol2: raise HTTPException(400,detail={"ok":False,"error":"mol1 and mol2 parameters required"})
        value=get_interaction(mol1,mol2)
        return {"ok":bool(value),"mol1":mol1,"mol2":mol2,"interaction":value,"source":"cache" if value else None}

    @router.get("/hub/{key}")
    def molecule_hub(key: str):
        value=hub(key); return {"ok":bool(value),**(value or {"error":f'Molecule "{key}" not found'})}

    @router.get("/network")
    def molecular_network(): return {"ok":True,**network()}

    @router.get("/health")
    def health():
        subs,mols,rxns,inters=all_substances(),all_molecules(),all_reactions(),all_interactions()
        counts={"manual":0,"ai_generated":0,"ai_reviewed":0}
        for mol in mols.values(): counts[mol.get("_source","manual")]=counts.get(mol.get("_source","manual"),0)+1
        return {"ok":True,"kb_status":{"substances":len(subs),"molecules":len(mols),"molecules_by_source":counts,
                "reactions":len(rxns),"interactions":len(inters),"ai_enabled":bool(os.getenv("GEMINI_API_KEY")),
                "model":os.getenv("GEMINI_MODEL","gemini-2.5-flash"),"dual_catalog_enabled":True}}

    @router.get("/vault/{key}")
    def vault(key: str):
        meta=all_substances().get(key) or all_molecules().get(key) or {}
        candidates=[key.replace("_"," "),meta.get("de_name") or "",meta.get("name") or ""]
        best=None; best_score=0
        for directory in vault_paths:
            if not directory.is_dir(): continue
            for file in directory.glob("*.md"):
                name=file.stem; lower=name.lower(); score=0
                for term in filter(None,candidates):
                    term=term.lower()
                    if lower==term: score=max(score,100); break
                    if term in lower: score=max(score,80)
                    first=re.split(r"[\s_-]",term)[0]
                    if len(first)>3 and first in lower: score=max(score,50)
                if score>best_score: best,best_score=(file,directory.name),score
        if not best or best_score<50: raise HTTPException(404,detail={"ok":False,"error":f'No vault file found for "{key}"'})
        file,section=best
        try: markdown=file.read_text(encoding="utf-8")
        except OSError: raise HTTPException(500,detail={"ok":False,"error":"Could not read vault file"})
        markdown=re.sub(r"^---[\s\S]*?---\n?","",markdown,count=1)
        def encode_link(value: str) -> str: return re.sub(r"[()]","",re.sub(r"\s+","_",value.lower()))
        markdown=re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]",lambda m:f'<span class="vault-link" data-vault-link="{encode_link(m.group(1))}">{m.group(2)}</span>',markdown)
        markdown=re.sub(r"\[\[([^\]]+)\]\]",lambda m:f'<span class="vault-link" data-vault-link="{encode_link(m.group(1))}">{m.group(1)}</span>',markdown)
        markdown=re.sub(r"(^|\s)#[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]*",r"\1",markdown).strip()
        return {"ok":True,"id":key,"title":file.stem,"section":section,"markdown":markdown}

    @router.get("/cache/stats")
    def cache_stats():
        if not cache_path.exists(): return {"ok":True,"cached_entries":0,"enriched_molecules":0,"db_path":str(cache_path)}
        with connect(cache_path) as con:
            cached=con.execute("SELECT COUNT(*) FROM external_cache").fetchone()[0]
            enriched=con.execute("SELECT COUNT(*) FROM enriched_molecules").fetchone()[0]
        return {"ok":True,"cached_entries":cached,"enriched_molecules":enriched,"db_path":str(cache_path)}

    return router
