"""In-process implementation of the Relax physiology simulation API."""
from __future__ import annotations

import math
from typing import Any

from fastapi import APIRouter, HTTPException


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _spike(peak: float, delay: float, decay: float, t: float) -> float:
    x = t - delay
    return 0.0 if x < 0 else peak * math.exp(-x / decay)


def _ramp(peak: float, rise: float, plateau: float, fall: float, t: float) -> float:
    if t < 0: return 0.0
    if t < rise: return (peak / rise) * t
    if t < rise + plateau: return peak
    progress = (t - rise - plateau) / fall
    return 0.0 if progress >= 1 else peak * (1 - progress)


def _event_effect(event: dict[str, Any]) -> dict[str, Any] | None:
    kind, at = event.get("type"), float(event.get("time", 0))
    if kind in ("coffee", "nicotine"):
        dose = min(float(event.get("dose") or 1), 10) / 10
        if kind == "coffee":
            return {"cortisol":lambda t:_spike(.3*dose,at+10,90,t),
                    "dopamine":lambda t:_spike(.25*dose,at+15,120,t),
                    "glucose":lambda t:_spike(.15*dose,at+20,60,t)}
        return {"cortisol":lambda t:_spike(.2*dose,at+5,45,t),
                "dopamine":lambda t:_spike(.4*dose,at+8,90,t),
                "glucose":lambda t:_spike(.1*dose,at+10,40,t)}
    if kind == "thc":
        factor = 1.0 if event.get("strength") == "high" else .5
        return {"cortisol":lambda t:_spike(.25*factor,at+15,180,t),
                "dopamine":lambda t:_spike(.35*factor,at+20,150,t),
                "glucose":lambda t:_spike(.2*factor,at+30,120,t)}
    if kind == "meal":
        macro=event.get("macro","carbs")
        glucose,dopamine={"carbs":(.6,.15),"protein":(.3,.25),"fat":(.15,.2)}.get(macro,(.3,.15))
        return {"cortisol":lambda t:_spike(.1,at+30,120,t),
                "dopamine":lambda t:_spike(dopamine,at+40,180,t),
                "glucose":lambda t:_ramp(glucose,20,60,120,t)}
    return None


def _simulate(payload: dict[str, Any]) -> dict[str, Any]:
    events=payload.get("events",[]); context=payload.get("context",{})
    horizon=payload.get("horizonMinutes",480); resolution=payload.get("resolution",1)
    if not isinstance(events,list): raise HTTPException(400,detail={"ok":False,"error":"events must be array"})
    if not isinstance(horizon,(int,float)) or horizon<=0 or horizon>1440:
        raise HTTPException(400,detail={"ok":False,"error":"horizonMinutes must be 1-1440"})
    if not isinstance(resolution,(int,float)) or resolution<=0 or resolution>horizon:
        raise HTTPException(400,detail={"ok":False,"error":"resolution must be positive number <= horizonMinutes"})
    if not isinstance(context,dict): raise HTTPException(400,detail={"ok":False,"error":"context must be object"})
    if any(not isinstance(e,dict) or e.get("type") not in ("coffee","nicotine","thc","meal") or not isinstance(e.get("time"), (int,float)) or e["time"]<0 for e in events):
        raise HTTPException(400,detail={"ok":False,"error":"each event must have a supported type and non-negative numeric time"})
    for name in ("sleepDebt","stressLevel"):
        value=context.get(name,0)
        if not isinstance(value,(int,float)) or not 0<=value<=1:
            raise HTTPException(400,detail={"ok":False,"error":f"context.{name} must be 0-1"})
    curves=[_event_effect(e) for e in events]
    curves=[c for c in curves if c]
    timestamps=[]; cortisol=[]; dopamine=[]; glucose=[]
    count=int(horizon/resolution)
    for i in range(count+1):
        t=i*resolution; values={"cortisol":0.0,"dopamine":0.0,"glucose":0.0}
        for effect in curves:
            for name in values:
                value=effect[name](t); values[name]+= (1-values[name])*value
        active=sum(1 for e in events if 0<=t-e["time"]<120)
        interference=1.0 if active<=1 else .85 if active==2 else .7
        values={k:v*interference for k,v in values.items()}
        fasted=bool(context.get("fasted",False)); sleep=context.get("sleepDebt",0); stress=context.get("stressLevel",0)
        cortisol_mult=1.15 if fasted else 1.0; glucose_mult=1.4 if fasted else 1.0
        cortisol_add=sleep*.3; dopamine_mult=max(.6,1-sleep*.5)
        if stress>0:
            cortisol_mult*=.8 if stress>.7 else 1+stress*.2
            dopamine_mult*=max(.5,1-stress*.6)
        phase=context.get("circadianPhase","morning")
        cortisol_add += {"morning":.2,"afternoon":.1,"evening":-.15}.get(phase,0)
        values["cortisol"]=_clamp(values["cortisol"]*cortisol_mult+cortisol_add)
        values["dopamine"]=_clamp(values["dopamine"]*dopamine_mult)
        values["glucose"]=_clamp(values["glucose"]*glucose_mult)
        timestamps.append(t); cortisol.append(values["cortisol"]); dopamine.append(values["dopamine"]); glucose.append(values["glucose"])
    def stability(series: list[float]) -> float:
        mean=sum(series)/len(series); variance=sum((x-mean)**2 for x in series)/len(series)
        return max(0,1-math.sqrt(variance)) if len(series)>=2 else 1
    volatility=sum(max(s)-min(s) for s in (cortisol,dopamine,glucose))/3
    return {"ok":True,"timestamps":timestamps,"curves":{"cortisol":cortisol,"dopamine":dopamine,"glucose":glucose},
            "metrics":{"stabilityIndex":round(stability(cortisol),2),"volatilityScore":round(volatility,2),
                       "peakCortisol":max(cortisol),"peakDopamine":max(dopamine),"peakGlucose":max(glucose),
                       "avgCortisol":f"{sum(cortisol)/len(cortisol):.2f}"}}


def create_router():
    router=APIRouter()
    @router.post("/simulate")
    def simulate(payload: dict[str, Any]): return _simulate(payload)
    return router
