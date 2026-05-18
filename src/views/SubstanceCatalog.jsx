import { useState, useEffect } from 'react'
import { Search, X, ChevronDown, Sparkles, Network } from 'lucide-react'
import KnowledgeGraph from '../components/KnowledgeGraph'

export default function SubstanceCatalog() {
  const [molecules, setMolecules] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedMol, setSelectedMol] = useState(null)
  const [interactions, setInteractions] = useState({})
  const [selectedTab, setSelectedTab] = useState('overview')
  const [expandedGroups, setExpandedGroups] = useState({})
  const [aiSearching, setAiSearching] = useState(false)
  const [aiStatus, setAiStatus] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'graph'
  const [graphQuery, setGraphQuery] = useState('')

  useEffect(() => {
    fetchMolecules()
  }, [])

  const fetchMolecules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/knowledge/molecules')
      const data = await res.json()
      setMolecules(data.molecules || {})
      setError(null)
      // Auto-expand first group
      const firstCat = getGroupedMolecules(data.molecules || {})[0]?.[0]
      if (firstCat) {
        setExpandedGroups({ [firstCat]: true })
      }
    } catch (err) {
      setError(`Failed to load molecules: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAiSearch = async () => {
    if (!search.trim() || aiSearching) return

    try {
      setAiSearching(true)
      setAiStatus('🤖 Advanced Enricher analyzing with KB context...')

      const res = await fetch(`/api/knowledge/molecule/${encodeURIComponent(search)}`)
      const data = await res.json()

      if (data.ok && (data.source === 'ai_generated' || data.source === 'ai_generated_unvalidated')) {
        setAiStatus(`✅ Generated with ${data.confidence} confidence. Fetching related interactions...`)

        // Optionally generate related interactions
        try {
          await fetch(`/api/knowledge/molecule/${encodeURIComponent(search)}/related-interactions`)
        } catch (err) {
          console.log('Related interactions generation skipped:', err.message)
        }

        await new Promise(r => setTimeout(r, 1200))
        await fetchMolecules()
        setSearch('')
        setAiStatus(`✨ "${search}" added with related interactions`)
      } else if (data.ok) {
        const source = data._source || data.source || 'manual'
        const confidence = data.confidence ? ` (${data.confidence} confidence)` : ''
        setAiStatus(`✓ Found "${search}" in catalog${confidence}`)
        setSelectedMol({
          key: search.toLowerCase().replace(/\s+/g, '_'),
          ...data.molecule
        })
        await new Promise(r => setTimeout(r, 1500))
      } else if (data.validation_errors) {
        setAiStatus(`⚠️ Generated but needs review: ${data.validation_errors.join(', ')}`)
      } else {
        setAiStatus(`❌ Could not find or generate "${search}"`)
      }
    } catch (err) {
      setAiStatus(`❌ Error: ${err.message}`)
    } finally {
      setAiSearching(false)
      setTimeout(() => setAiStatus(null), 4000)
    }
  }

  const fetchInteraction = async (mol1, mol2) => {
    const key = `${mol1}_${mol2}`
    if (interactions[key]) return

    try {
      const res = await fetch(`/api/knowledge/interaction?mol1=${mol1}&mol2=${mol2}`)
      const data = await res.json()
      setInteractions(prev => ({
        ...prev,
        [key]: data.interaction
      }))
    } catch (err) {
      console.error(`Failed to load interaction ${key}:`, err)
    }
  }

  const getGroupedMolecules = (mols) => {
    const grouped = {}
    Object.entries(mols).forEach(([key, mol]) => {
      const cat = mol.category || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push([key, mol])
    })
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }

  const filtered = Object.entries(molecules).filter(([key, mol]) => {
    const q = search.toLowerCase()
    return (
      key.toLowerCase().includes(q) ||
      mol.name?.toLowerCase().includes(q) ||
      mol.de_name?.toLowerCase().includes(q) ||
      mol.category?.toLowerCase().includes(q) ||
      mol.functions?.some(f => f.toLowerCase().includes(q))
    )
  })

  const groupedFiltered = (() => {
    const grouped = {}
    filtered.forEach(([key, mol]) => {
      const cat = mol.category || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push([key, mol])
    })
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  })()

  const getRelevanceColor = (rel) => {
    if (!rel) return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-200' }
    if (rel.includes('high_positive')) return { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-200' }
    if (rel.includes('moderate_positive')) return { bg: 'bg-lime-50', text: 'text-lime-700', badge: 'bg-lime-200' }
    if (rel.includes('neutral')) return { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-200' }
    if (rel.includes('moderate_negative')) return { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-200' }
    if (rel.includes('high_negative')) return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-200' }
    return { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-200' }
  }

  const getRelevanceLabel = (rel) => {
    if (!rel) return '?'
    if (rel.includes('high_positive')) return '+++'
    if (rel.includes('moderate_positive')) return '++'
    if (rel.includes('neutral')) return '○'
    if (rel.includes('moderate_negative')) return '−−'
    if (rel.includes('high_negative')) return '−−−'
    return '?'
  }

  const getCategoryColor = (cat) => {
    const colors = {
      hormone: 'bg-purple-100 text-purple-800',
      neurotransmitter: 'bg-blue-100 text-blue-800',
      mineral: 'bg-amber-100 text-amber-800',
      alkaloid: 'bg-orange-100 text-orange-800',
      amino_acid: 'bg-pink-100 text-pink-800',
      cytokine: 'bg-red-100 text-red-800',
      supplement: 'bg-green-100 text-green-800',
      default: 'bg-gray-100 text-gray-800'
    }
    return colors[cat] || colors.default
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 shrink-0" style={{ borderColor: 'var(--line)' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>
              🧪 Substance Catalog
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {viewMode === 'list'
                ? `Browse ${Object.keys(molecules).length} molecules with effects, timing, and interactions`
                : 'Explore substance-molecule relationships as interactive graph'}
            </p>
          </div>
          {/* View Mode Toggle */}
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'list'
                  ? 'border-2'
                  : 'border opacity-60 hover:opacity-80'
              }`}
              style={{
                borderColor: viewMode === 'list' ? 'var(--accent)' : 'var(--line)',
                color: viewMode === 'list' ? 'var(--accent)' : 'var(--muted)',
                background: viewMode === 'list' ? 'rgba(137,180,250,0.1)' : 'transparent'
              }}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'graph'
                  ? 'border-2'
                  : 'border opacity-60 hover:opacity-80'
              }`}
              style={{
                borderColor: viewMode === 'graph' ? 'var(--accent)' : 'var(--line)',
                color: viewMode === 'graph' ? 'var(--accent)' : 'var(--muted)',
                background: viewMode === 'graph' ? 'rgba(137,180,250,0.1)' : 'transparent'
              }}
            >
              <Network size={14} />
              Graph
            </button>
          </div>
        </div>

        {/* Search Bar with AI Enrichment */}
        <div className="space-y-2">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder={
                  viewMode === 'list'
                    ? 'Search by name... (or type new substance for Gemini to research)'
                    : 'Search substance or molecule for graph visualization...'
                }
                value={viewMode === 'list' ? search : graphQuery}
                onChange={(e) => viewMode === 'list' ? setSearch(e.target.value) : setGraphQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (viewMode === 'list') handleAiSearch()
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm font-medium"
                style={{
                  background: 'var(--glass)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                }}
              />
            </div>
            {viewMode === 'list' && search.trim() && (
              <button
                onClick={handleAiSearch}
                disabled={aiSearching}
                className="px-3 py-2.5 rounded-lg border font-semibold text-sm transition flex items-center gap-1.5"
                style={{
                  borderColor: 'var(--line)',
                  background: aiSearching ? 'var(--glass)' : 'var(--accent)',
                  color: aiSearching ? 'var(--muted)' : 'white',
                  opacity: aiSearching ? 0.6 : 1,
                }}
              >
                <Sparkles size={14} />
                {aiSearching ? 'Searching...' : 'Ask AI'}
              </button>
            )}
          </div>
          {aiStatus && (
            <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--glass)', color: 'var(--accent)' }}>
              {aiStatus}
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs mt-2 text-red-600">{error}</p>
        )}
        {loading && (
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Loading KB...</p>
        )}
        {!loading && (
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            Showing {filtered.length} of {Object.keys(molecules).length}
          </p>
        )}
      </div>

      {/* Content: List View or Graph View */}
      {viewMode === 'graph' ? (
        <div className="flex-1 overflow-auto">
          {graphQuery.trim() ? (
            <KnowledgeGraph query={graphQuery} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Network size={48} style={{ color: 'var(--dim)', marginBottom: '12px', marginLeft: 'auto', marginRight: 'auto' }} />
                <p className="text-lg font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                  Enter a query to visualize the graph
                </p>
                <p className="text-sm" style={{ color: 'var(--dim)' }}>
                  Search for a substance (mulungu, ashwagandha) or molecule (caffeine, l_theanine)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grouped Categories */
        <div className="flex-1 overflow-auto p-4">
          {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                No molecules found
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Try a different search term or ask Gemini to research it
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedFiltered.map(([category, mols]) => (
              <div key={category}>
                {/* Category Header */}
                <button
                  onClick={() => setExpandedGroups(prev => ({
                    ...prev,
                    [category]: !prev[category]
                  }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-80"
                  style={{ background: 'var(--glass)', color: 'var(--accent)' }}
                >
                  <ChevronDown
                    size={16}
                    style={{
                      transform: expandedGroups[category] ? 'rotate(0)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                  <span className="capitalize flex-1 text-left">{category}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    {mols.length}
                  </span>
                </button>

                {/* Category Molecules Grid */}
                {expandedGroups[category] && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pl-4">
                    {mols.map(([key, mol]) => {
                      const relevance = getRelevanceColor(mol.relaxation_relevance)
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedMol({ key, ...mol })
                            setSelectedTab('overview')
                          }}
                          className={`p-3 rounded-lg border text-left transition-all hover:scale-105 active:scale-95 ${relevance.bg}`}
                          style={{ borderColor: 'var(--line)' }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                                {mol.name}
                              </h3>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                {mol.de_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className={`text-xs px-2 py-1 rounded font-bold ${relevance.badge}`}>
                              {getRelevanceLabel(mol.relaxation_relevance)}
                            </span>
                          </div>

                          {mol.functions && mol.functions.length > 0 && (
                            <p className="text-xs leading-snug" style={{ color: 'var(--muted)' }}>
                              {mol.functions.slice(0, 2).join(' • ')}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedMol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div
            className="w-full max-h-[90vh] rounded-t-3xl overflow-hidden flex flex-col"
            style={{ background: 'var(--card)' }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 border-b p-4 flex items-center justify-between shrink-0" style={{ borderColor: 'var(--line)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
                    {selectedMol.name}
                  </h2>
                  {selectedMol._source && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: selectedMol._source === 'manual' ? 'var(--accent)' : 'rgba(255,193,7,0.2)',
                      color: selectedMol._source === 'manual' ? 'white' : 'var(--accent)'
                    }}>
                      {selectedMol._source === 'manual' ? '👤 Manual' : '🤖 AI'}
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  {selectedMol.de_name} • {selectedMol.category}
                </p>
                {selectedMol._metadata?.confidence && (
                  <p className="text-xs mt-1" style={{ color: 'var(--dim)' }}>
                    Confidence: {selectedMol._metadata.confidence}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedMol(null)}
                className="p-2 hover:opacity-70 rounded-lg transition"
              >
                <X className="w-5 h-5" style={{ color: 'var(--ink)' }} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b gap-0 shrink-0" style={{ borderColor: 'var(--line)' }}>
              {['overview', 'effects', 'sources', 'interactions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex-1 py-2 text-sm font-semibold border-b-2 transition ${
                    selectedTab === tab
                      ? 'border-accent'
                      : 'border-transparent'
                  }`}
                  style={{
                    color: selectedTab === tab ? 'var(--accent)' : 'var(--muted)',
                    borderBottomColor: selectedTab === tab ? 'var(--accent)' : 'transparent'
                  }}
                >
                  {tab === 'overview' && '📋'}
                  {tab === 'effects' && '⚡'}
                  {tab === 'sources' && '🥗'}
                  {tab === 'interactions' && '🔗'}
                  {' ' + tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Overview Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--glass)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Formula</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--ink)' }}>
                        {selectedMol.formula || '—'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'var(--glass)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Relaxation Impact</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getRelevanceColor(selectedMol.relaxation_relevance).badge}`}>
                        {selectedMol.relaxation_relevance || '?'}
                      </span>
                    </div>
                  </div>

                  {selectedMol.functions && selectedMol.functions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Functions</h4>
                      <ul className="space-y-1">
                        {selectedMol.functions.map((fn, i) => (
                          <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                            <span>•</span>
                            <span>{fn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedMol.notes && (
                    <div className="p-3 rounded-lg border-l-4" style={{ background: 'var(--glass)', borderLeftColor: 'var(--accent)' }}>
                      <p className="text-sm" style={{ color: 'var(--ink)' }}>
                        📝 {selectedMol.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Effects Tab */}
              {selectedTab === 'effects' && (
                <div className="space-y-3">
                  {selectedMol.primary_effects && Object.keys(selectedMol.primary_effects).length > 0 ? (
                    Object.entries(selectedMol.primary_effects).map(([effect, data]) => (
                      <div key={effect} className="p-3 rounded-lg" style={{ background: 'var(--glass)' }}>
                        <h5 className="font-semibold text-sm mb-2" style={{ color: 'var(--ink)' }}>
                          {effect}
                        </h5>
                        {typeof data === 'object' && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {data.direction && (
                              <div>
                                <p style={{ color: 'var(--muted)' }}>Direction</p>
                                <p style={{ color: 'var(--accent)' }} className="font-semibold">{data.direction}</p>
                              </div>
                            )}
                            {data.magnitude && (
                              <div>
                                <p style={{ color: 'var(--muted)' }}>Magnitude</p>
                                <p style={{ color: 'var(--accent)' }} className="font-semibold">{data.magnitude}%</p>
                              </div>
                            )}
                            {data.onset_minutes && (
                              <div>
                                <p style={{ color: 'var(--muted)' }}>Onset</p>
                                <p style={{ color: 'var(--accent)' }} className="font-semibold">{data.onset_minutes}m</p>
                              </div>
                            )}
                            {data.peak_minutes && (
                              <div>
                                <p style={{ color: 'var(--muted)' }}>Peak</p>
                                <p style={{ color: 'var(--accent)' }} className="font-semibold">{data.peak_minutes}m</p>
                              </div>
                            )}
                            {data.duration_minutes && (
                              <div className="col-span-2">
                                <p style={{ color: 'var(--muted)' }}>Duration</p>
                                <p style={{ color: 'var(--accent)' }} className="font-semibold">{data.duration_minutes}m</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted)' }}>No effect data available</p>
                  )}
                </div>
              )}

              {/* Sources Tab */}
              {selectedTab === 'sources' && (
                <div className="space-y-3">
                  {selectedMol.sources?.external && selectedMol.sources.external.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>External Sources</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedMol.sources.external.map((src, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs rounded font-medium"
                            style={{ background: 'var(--glass)', color: 'var(--ink)' }}
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedMol.sources?.endogenous && (
                    <div className="p-3 rounded-lg" style={{ background: 'var(--glass)', borderLeft: '3px solid var(--accent)' }}>
                      <p className="text-sm" style={{ color: 'var(--ink)' }}>
                        ✓ Produced endogenously by the body
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Interactions Tab */}
              {selectedTab === 'interactions' && (
                <div className="space-y-2">
                  {selectedMol.affects && selectedMol.affects.length > 0 ? (
                    <>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Affects other molecules:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMol.affects.map((mol, i) => (
                          <button
                            key={i}
                            onClick={() => fetchInteraction(selectedMol.key, mol)}
                            className="px-3 py-1.5 text-xs rounded border font-medium transition hover:opacity-80"
                            style={{
                              borderColor: 'var(--accent)',
                              color: 'var(--accent)',
                              background: 'transparent'
                            }}
                          >
                            {mol} →
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ color: 'var(--muted)' }}>No interaction data available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
