import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'

const CAT_COLORS = {
  neurotransmitter:           '#89b4fa',
  hormone:                    '#cba6f7',
  amino_acid:                 '#a6e3a1',
  mineral:                    '#f9e2af',
  alkaloid:                   '#fab387',
  alkaloid_steroidal:         '#fab387',
  alkaloid_methylxanthine:    '#fab387',
  beta_carboline_alkaloid:    '#fab387',
  quassinoid:                 '#fab387',
  bioactive_peptides:         '#f5c2e7',
  cytokine:                   '#f38ba8',
  neuropeptide:               '#f38ba8',
  supplement:                 '#94e2d5',
  flavonoid:                  '#a6e3a1',
  flavonoid_complex:          '#a6e3a1',
  flavonoid_c_glycoside:      '#a6e3a1',
  catechin_polyphenol:        '#a6e3a1',
  terpene:                    '#94e2d5',
  terpene_ester:              '#94e2d5',
  polyphenol:                 '#cdd6f4',
  hydroxycinnamic_acid:       '#cdd6f4',
  phenylpropanoid_glycoside:  '#cdd6f4',
  cinnamyl_glycoside:         '#cdd6f4',
  nucleoside:                 '#eba0ac',
  default:                    '#9399b2',
}

// Cluster centers for network layout (pixels)
const CAT_CLUSTER = {
  neurotransmitter:        { x:   0,  y:   0 },
  hormone:                 { x: 700,  y:   0 },
  amino_acid:              { x: 350,  y: 480 },
  mineral:                 { x: 350,  y:-320 },
  nucleoside:              { x:   0,  y:-320 },
  // alkaloid family → one cluster
  alkaloid:                { x:-420,  y:-160 },
  alkaloid_steroidal:      { x:-420,  y:-160 },
  alkaloid_methylxanthine: { x:-420,  y:-160 },
  beta_carboline_alkaloid: { x:-420,  y:-160 },
  quassinoid:              { x:-420,  y:-160 },
  bioactive_peptides:      { x:-420,  y:-160 },
  // flavonoid family
  flavonoid:               { x: 950,  y: 380 },
  flavonoid_complex:       { x: 950,  y: 380 },
  flavonoid_c_glycoside:   { x: 950,  y: 380 },
  catechin_polyphenol:     { x: 950,  y: 380 },
  // polyphenol family
  polyphenol:              { x:-420,  y: 320 },
  hydroxycinnamic_acid:    { x:-420,  y: 320 },
  phenylpropanoid_glycoside:{ x:-420, y: 320 },
  cinnamyl_glycoside:      { x:-420,  y: 320 },
  // terpene
  terpene:                 { x: 700,  y:-320 },
  terpene_ester:           { x: 700,  y:-320 },
  // immune
  cytokine:                { x:1100,  y: 100 },
  neuropeptide:            { x:1100,  y: 100 },
  supplement:              { x: 350,  y: 800 },
  default:                 { x: 800,  y:-320 },
}

function catColor(cat) {
  return CAT_COLORS[cat] || CAT_COLORS.default
}

function clusterCenter(cat) {
  return CAT_CLUSTER[cat] || CAT_CLUSTER.default
}

// ── Node Components ────────────────────────────────────────────────────────

function SubstanceOverviewNode({ data }) {
  return (
    <div
      title="Click to expand"
      style={{
        background: 'var(--card)',
        border: `2px solid ${catColor(data.category)}`,
        borderRadius: '10px',
        padding: '10px 14px',
        color: 'var(--ink)',
        width: '160px',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        transition: 'transform 0.1s',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>{data.label}</div>
      <div style={{ fontSize: '10px', color: catColor(data.category), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {data.category}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '4px' }}>
        {data.moleculeCount} molecules
      </div>
    </div>
  )
}

function SubstanceNode({ data }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '2px solid var(--accent)',
      borderRadius: '10px',
      padding: '12px 18px',
      color: 'var(--ink)',
      width: '180px',
      textAlign: 'center',
      boxShadow: '0 0 20px var(--accent-glow)',
    }}>
      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{data.label}</div>
      <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {data.category}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '4px' }}>{data.moleculeCount} molecules</div>
    </div>
  )
}

function MoleculeNode({ data }) {
  const border = data.relaxationRelevance === 'high_positive'
    ? 'var(--green)'
    : data.relaxationRelevance === 'high_negative'
    ? 'var(--red)'
    : 'var(--line)'

  return (
    <div style={{
      background: data.highlighted ? 'var(--accent)' : 'var(--card)',
      border: `1.5px solid ${data.highlighted ? 'var(--accent)' : border}`,
      borderRadius: '8px',
      padding: '8px 12px',
      color: data.highlighted ? '#fff' : 'var(--ink)',
      width: '130px',
      textAlign: 'center',
      fontSize: '11px',
      transition: 'all 0.15s',
      opacity: data.dimmed ? 0.3 : 1,
    }}>
      <div style={{ fontWeight: 600, marginBottom: '3px' }}>{data.label}</div>
      <div style={{ fontSize: '9px', color: data.highlighted ? 'rgba(255,255,255,0.8)' : catColor(data.category), fontWeight: 600, textTransform: 'uppercase' }}>
        {data.category}
      </div>
      {data.tags?.length > 0 && (
        <div style={{ fontSize: '8px', color: data.highlighted ? 'rgba(255,255,255,0.6)' : 'var(--dim)', marginTop: '3px' }}>
          {data.tags.slice(0, 2).join(' · ')}
        </div>
      )}
    </div>
  )
}

function HubNode({ data }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '2.5px solid var(--red)',
      borderRadius: '50%',
      padding: '14px 18px',
      color: 'var(--ink)',
      width: '140px',
      textAlign: 'center',
      boxShadow: '0 0 24px rgba(243,139,168,0.3)',
    }}>
      <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '3px' }}>{data.label}</div>
      <div style={{ fontSize: '9px', color: 'var(--red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>HUB</div>
    </div>
  )
}

const nodeTypes = {
  substanceOverview: (props) => <SubstanceOverviewNode {...props} />,
  substance:         (props) => <SubstanceNode {...props} />,
  molecule:          (props) => <MoleculeNode {...props} />,
  hub:               (props) => <HubNode {...props} />,
}

// ── Graph Builders ─────────────────────────────────────────────────────────

function buildExpandedGraph(data) {
  const { substance, targets = [], molecules = [] } = data
  const newNodes = []
  const newEdges = []

  if (substance) {
    newNodes.push({
      id: substance._key,
      data: { label: substance.name, category: substance.category, moleculeCount: molecules.length },
      position: { x: 0, y: 0 },
      type: 'substance',
    })
  }

  const radius = 280
  targets.forEach((target, idx) => {
    const angle = (idx / Math.max(targets.length, 1)) * Math.PI * 2
    newNodes.push({
      id: target._key,
      data: { label: target.de_name || target.name, category: target.category, relaxationRelevance: target.relaxation_relevance, tags: target.tags },
      position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
      type: 'molecule',
    })

    // One edge per mediating molecule (alkaloid/flavonoid/terpene as label)
    target.via.forEach((via, vIdx) => {
      const isPositive = via.direction === 'increase' || via.direction === 'potentiate'
      const isNegative = via.direction === 'decrease'
      newEdges.push({
        id: `${substance._key}-${target._key}-${vIdx}`,
        source: substance._key,
        target: target._key,
        label: via.mol_name,
        animated: isPositive,
        style: {
          stroke: isPositive ? 'var(--green)' : isNegative ? 'var(--red)' : 'var(--line)',
          strokeWidth: 2,
          strokeDasharray: isNegative ? '5,5' : '0',
        },
        labelStyle: { fontSize: 9, fill: 'var(--dim)', fontWeight: 600 },
        labelBgStyle: { fill: 'var(--card)', fillOpacity: 0.85 },
      })
    })
  })

  // Fallback: no targets derived yet → show molecules as nodes (old behaviour)
  if (targets.length === 0) {
    molecules.forEach((mol, idx) => {
      const angle = (idx / Math.max(molecules.length, 1)) * Math.PI * 2
      newNodes.push({
        id: mol._key,
        data: { label: mol.de_name || mol.name, category: mol.category, relaxationRelevance: mol.relaxation_relevance, tags: mol.tags },
        position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
        type: 'molecule',
      })
      newEdges.push({
        id: `${substance._key}-${mol._key}`,
        source: substance._key,
        target: mol._key,
        animated: true,
        style: { stroke: 'var(--line)', strokeWidth: 1.5 },
      })
    })
  }

  return { newNodes, newEdges }
}

function buildHubGraph(data) {
  const { hub, affecting_substances, affecting_molecules, related_molecules } = data
  const newNodes = []
  const newEdges = []

  newNodes.push({
    id: hub._key,
    type: 'hub',
    data: { label: hub.de_name || hub.name },
    position: { x: 0, y: 0 },
  })

  affecting_substances.forEach((sub, i) => {
    const total = affecting_substances.length
    const angle = (i / Math.max(total, 1)) * Math.PI - Math.PI / 2
    const r = 320
    newNodes.push({
      id: sub._key,
      type: 'substance',
      data: { label: sub.de_name || sub.name, category: sub.category, moleculeCount: sub.references?.length || 0 },
      position: { x: Math.cos(angle) * r, y: Math.sin(angle) * r - 80 },
    })
    newEdges.push({
      id: `sub-${sub._key}-hub`,
      source: sub._key,
      target: hub._key,
      animated: true,
      label: `via ${sub.via_molecule}`,
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      labelStyle: { fontSize: 9, fill: 'var(--dim)' },
    })
  })

  related_molecules.forEach((mol, i) => {
    const total = related_molecules.length
    const angle = (i / Math.max(total, 1)) * Math.PI + Math.PI / 2
    const r = 260
    newNodes.push({
      id: `rel-${mol._key}`,
      type: 'molecule',
      data: { label: mol.de_name || mol.name, category: mol.category, relaxationRelevance: mol.relaxation_relevance, tags: mol.tags },
      position: { x: Math.cos(angle) * r, y: Math.sin(angle) * r + 80 },
    })
    const synergistic = mol.interaction?.type?.includes('synergistic')
    newEdges.push({
      id: `hub-${mol._key}`,
      source: hub._key,
      target: `rel-${mol._key}`,
      label: mol.interaction?.type,
      style: {
        stroke: synergistic ? 'var(--green)' : 'var(--red)',
        strokeWidth: 1.5,
        strokeDasharray: synergistic ? '0' : '5,5',
      },
      labelStyle: { fontSize: 9, fill: 'var(--dim)' },
    })
  })

  return { newNodes, newEdges }
}

function buildNetworkGraph(data, focusKey = null) {
  const { nodes: rawNodes, edges: rawEdges } = data

  // Track which nodes are connected to focusKey
  const connectedKeys = new Set()
  if (focusKey) {
    connectedKeys.add(focusKey)
    for (const e of rawEdges) {
      if (e.source === focusKey) connectedKeys.add(e.target)
      if (e.target === focusKey) connectedKeys.add(e.source)
    }
  }

  // Position molecules in category clusters
  const byCluster = {}
  for (const node of rawNodes) {
    const center = clusterCenter(node.category)
    const ck = `${center.x},${center.y}`
    if (!byCluster[ck]) byCluster[ck] = { center, mols: [] }
    byCluster[ck].mols.push(node)
  }

  const nodes = []
  const CLUSTER_R = 130

  for (const { center, mols } of Object.values(byCluster)) {
    mols.forEach((mol, i) => {
      const angle = (i / Math.max(mols.length, 1)) * Math.PI * 2
      const highlighted = focusKey === mol._key
      const dimmed = focusKey ? !connectedKeys.has(mol._key) : false
      nodes.push({
        id: mol._key,
        type: 'molecule',
        data: {
          label: mol.name,
          category: mol.category,
          tags: mol.tags,
          relaxationRelevance: mol.relaxation_relevance,
          highlighted,
          dimmed,
        },
        position: {
          x: center.x + Math.cos(angle) * CLUSTER_R,
          y: center.y + Math.sin(angle) * CLUSTER_R,
        },
      })
    })
  }

  const edges = rawEdges.map(e => {
    const active = !focusKey || connectedKeys.has(e.source) && connectedKeys.has(e.target)
    const isIncrease = e.direction === 'increase' || e.direction === 'potentiate'
    const isDecrease = e.direction === 'decrease'
    const isSynergistic = e.type === 'synergistic'
    const isAntagonistic = e.type === 'antagonistic'

    const stroke = isSynergistic || isIncrease ? 'var(--green)'
      : isAntagonistic || isDecrease ? 'var(--red)'
      : 'var(--line)'

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: isSynergistic || isIncrease,
      style: {
        stroke,
        strokeWidth: active ? 2 : 0.5,
        strokeDasharray: isAntagonistic || isDecrease ? '5,5' : '0',
        opacity: active ? 1 : 0.12,
      },
      labelStyle: { fontSize: 8, fill: 'var(--dim)' },
    }
  })

  return { newNodes: nodes, newEdges: edges }
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function KnowledgeGraph({ query }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [mode, setMode] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [networkData, setNetworkData] = useState(null)  // raw network for refocus
  const [focusKey, setFocusKey] = useState(null)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    setMode('overview')
    setFocusKey(null)
    try {
      const res = await fetch('/api/knowledge/substances')
      const data = await res.json()
      const entries = Object.entries(data.substances || {})
      const cols = 4
      const xGap = 200
      const yGap = 150

      const newNodes = entries.map(([key, sub], idx) => ({
        id: key,
        data: { label: sub.name, category: sub.category, moleculeCount: sub.references?.length || 0, key },
        position: { x: (idx % cols) * xGap, y: Math.floor(idx / cols) * yGap },
        type: 'substanceOverview',
      }))

      setNodes(newNodes)
      setEdges([])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  const loadSubstance = useCallback(async (q) => {
    setLoading(true)
    setError(null)
    setMode('expanded')
    setFocusKey(null)
    try {
      const res = await fetch(`/api/knowledge/expand?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!data.ok || !data.data) {
        setError(data.suggestion || `"${q}" nicht gefunden`)
        setLoading(false)
        return
      }
      const { newNodes, newEdges } = buildExpandedGraph(data.data)
      setNodes(newNodes)
      setEdges(newEdges)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  const loadHub = useCallback(async (molKey) => {
    setLoading(true)
    setError(null)
    setMode('hub')
    setFocusKey(null)
    try {
      const res = await fetch(`/api/knowledge/hub/${encodeURIComponent(molKey)}`)
      const data = await res.json()
      if (!data.ok) {
        setError(`Kein Hub für "${molKey}"`)
        setLoading(false)
        return
      }
      const { newNodes, newEdges } = buildHubGraph(data)
      setNodes(newNodes)
      setEdges(newEdges)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  const loadNetwork = useCallback(async (initialFocus = null) => {
    setLoading(true)
    setError(null)
    setMode('network')
    setFocusKey(initialFocus)
    try {
      const res = await fetch('/api/knowledge/network')
      const data = await res.json()
      if (!data.ok) { setError('Netzwerk konnte nicht geladen werden'); return }
      setNetworkData(data)
      const { newNodes, newEdges } = buildNetworkGraph(data, initialFocus)
      setNodes(newNodes)
      setEdges(newEdges)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  // Refocus network without re-fetching
  const refocusNetwork = useCallback((key) => {
    if (!networkData) return
    const nextFocus = key === focusKey ? null : key
    setFocusKey(nextFocus)
    const { newNodes, newEdges } = buildNetworkGraph(networkData, nextFocus)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [networkData, focusKey, setNodes, setEdges])

  useEffect(() => {
    if (query?.trim()) {
      loadSubstance(query.trim())
    } else {
      loadOverview()
    }
  }, [query, loadOverview, loadSubstance])

  const onNodeClick = useCallback((_, node) => {
    if (mode === 'overview') {
      loadSubstance(node.id)
    } else if (mode === 'expanded' && node.type === 'molecule') {
      loadHub(node.id)
    } else if (mode === 'network') {
      refocusNetwork(node.id)
    }
  }, [mode, loadSubstance, loadHub, refocusNetwork])

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', position: 'relative' }}>

      {/* Nav bar */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(mode === 'expanded' || mode === 'hub' || mode === 'network') && (
          <button onClick={loadOverview} style={btnStyle}>← Alle Substanzen</button>
        )}
        <button
          onClick={() => mode === 'network' ? loadOverview() : loadNetwork()}
          style={{ ...btnStyle, color: mode === 'network' ? 'var(--accent)' : 'var(--dim)', borderColor: mode === 'network' ? 'var(--accent)' : 'var(--line)' }}
        >
          {mode === 'network' ? '◉ Netzwerk' : '⬡ Molekülnetz'}
        </button>
        {mode === 'hub' && (
          <span style={{ ...badgeStyle, color: 'var(--red)', borderColor: 'var(--line)' }}>
            Hub-Ansicht · Klick auf Substanz zum Expandieren
          </span>
        )}
        {mode === 'network' && (
          <span style={{ ...badgeStyle, color: 'var(--dim)' }}>
            {focusKey
              ? `Fokus: ${focusKey} · Klick zum Aufheben`
              : 'Klick auf Molekül zum Fokussieren'}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <span className="spinner" />
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 5, color: 'var(--red)', fontWeight: 600, fontSize: '14px', background: 'var(--card)', padding: '16px 24px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          ⚠️ {error}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="var(--line)" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'substanceOverview' || n.type === 'substance') return 'var(--accent)'
            if (n.type === 'hub') return 'var(--red)'
            return catColor(n.data?.category)
          }}
          style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
        />
      </ReactFlow>
    </div>
  )
}

const btnStyle = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: 600,
}

const badgeStyle = {
  padding: '6px 10px',
  fontSize: '11px',
  fontWeight: 700,
  background: 'var(--card)',
  borderRadius: '8px',
  border: '1px solid var(--line)',
}
