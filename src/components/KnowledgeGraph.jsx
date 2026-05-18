import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'

const nodeTypes = {
  substance: (props) => <SubstanceNode {...props} />,
  molecule: (props) => <MoleculeNode {...props} />,
}

function SubstanceNode({ data }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '2px solid var(--accent)',
      borderRadius: '8px',
      padding: '12px 16px',
      color: 'var(--ink)',
      maxWidth: '180px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
        {data.category}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '6px' }}>
        {data.moleculeCount} molecules
      </div>
    </div>
  )
}

function MoleculeNode({ data }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: `2px solid ${data.relaxationRelevance === 'high_positive' ? 'var(--green)' : 'var(--line)'}`,
      borderRadius: '6px',
      padding: '8px 12px',
      color: 'var(--ink)',
      maxWidth: '140px',
      textAlign: 'center',
      fontSize: '12px'
    }}>
      <div style={{ fontWeight: '600' }}>{data.label}</div>
      <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '4px' }}>
        {data.category}
      </div>
    </div>
  )
}

export default function KnowledgeGraph({ query }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!query) {
      setNodes([])
      setEdges([])
      return
    }

    const fetchGraph = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/knowledge/expand?q=${encodeURIComponent(query)}`)
        const data = await res.json()

        if (!data.ok || !data.data) {
          setError(data.suggestion || 'Not found')
          return
        }

        const { substance, molecules, interactions } = data.data

        // Create nodes
        const newNodes = []
        const newEdges = []

        // Central substance node
        if (substance) {
          newNodes.push({
            id: substance._key,
            data: {
              label: substance.name,
              category: substance.category,
              moleculeCount: molecules.length,
            },
            position: { x: 0, y: 0 },
            type: 'substance',
          })
        }

        // Molecule nodes arranged in circle around substance
        const radius = 280
        molecules.forEach((mol, idx) => {
          const angle = (idx / Math.max(molecules.length, 1)) * Math.PI * 2
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius

          newNodes.push({
            id: mol._key,
            data: {
              label: mol.name,
              category: mol.category,
              relaxationRelevance: mol.relaxation_relevance,
            },
            position: { x, y },
            type: 'molecule',
          })

          // Edge from substance to molecule
          newEdges.push({
            id: `${substance._key}-${mol._key}`,
            source: substance._key,
            target: mol._key,
            animated: true,
            style: { stroke: 'var(--line)', strokeWidth: 1.5 },
          })
        })

        // Molecule-to-molecule interactions (if any)
        interactions.forEach((inter) => {
          const molKeys = inter.molecules || []
          if (molKeys.length === 2) {
            newEdges.push({
              id: `${molKeys[0]}-${molKeys[1]}`,
              source: molKeys[0],
              target: molKeys[1],
              animated: inter.type === 'synergistic',
              style: {
                stroke: inter.type === 'synergistic' ? 'var(--green)' : inter.type === 'antagonistic' ? 'var(--red)' : 'var(--dim)',
                strokeWidth: 2,
                strokeDasharray: inter.type === 'antagonistic' ? '5,5' : '0',
              },
              label: inter.type,
            })
          }
        })

        setNodes(newNodes)
        setEdges(newEdges)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGraph()
  }, [query, setNodes, setEdges])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '500px', color: 'var(--muted)' }}>
        <span className="spinner"></span> Loading graph...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '500px', color: 'var(--red)' }}>
        ⚠️ {error}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
