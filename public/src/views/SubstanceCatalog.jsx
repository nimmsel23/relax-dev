import { useState, useEffect } from 'react'
import { Search, X, ChevronDown, Network, BookOpen } from 'lucide-react'
import KnowledgeGraph from '../components/KnowledgeGraph'
import { marked } from 'marked'

export default function SubstanceCatalog() {
  const [substances, setSubstances] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [graphQuery, setGraphQuery] = useState('')
  const [graphOverview, setGraphOverview] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [expandedGroups, setExpandedGroups] = useState({})
  const [selected, setSelected] = useState(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [expandedData, setExpandedData] = useState(null)
  const [expandLoading, setExpandLoading] = useState(false)
  const [vaultContent, setVaultContent] = useState(null)
  const [vaultLoading, setVaultLoading] = useState(false)

  useEffect(() => { fetchSubstances() }, [])

  const fetchSubstances = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge/substances')
      const data = await res.json()
      const subs = data.substances || {}
      setSubstances(subs)
      const firstCat = grouped(subs)[0]?.[0]
      if (firstCat) setExpandedGroups({ [firstCat]: true })
    } finally {
      setLoading(false)
    }
  }

  const fetchExpanded = async (key) => {
    setExpandedData(null)
    setExpandLoading(true)
    try {
      const res = await fetch(`/api/knowledge/expand/substance/${encodeURIComponent(key)}`)
      const data = await res.json()
      if (data.ok) setExpandedData(data)
    } finally {
      setExpandLoading(false)
    }
  }

  const fetchVault = async (key) => {
    setVaultContent(null)
    setVaultLoading(true)
    try {
      const res = await fetch(`/api/knowledge/vault/${encodeURIComponent(key)}`)
      const data = await res.json()
      setVaultContent(data.ok
        ? { title: data.title, section: data.section, html: marked.parse(data.markdown) }
        : { notFound: true }
      )
    } catch {
      setVaultContent({ notFound: true })
    } finally {
      setVaultLoading(false)
    }
  }

  const openSubstance = (key, sub) => {
    setSelected({ key, ...sub })
    setSelectedTab('overview')
    setExpandedData(null)
    setVaultContent(null)
  }

  // Handle clicks on [[wikilinks]] inside rendered vault markdown
  const handleVaultLinkClick = (e) => {
    const link = e.target.dataset?.vaultLink
    if (!link) return
    e.preventDefault()
    const sub = substances[link]
    if (sub) {
      openSubstance(link, sub)
      return
    }
    // try fuzzy: find substance whose de_name or name normalizes to this key
    const fuzzy = Object.entries(substances).find(([k, s]) =>
      k === link ||
      s.de_name?.toLowerCase().replace(/\s+/g, '_') === link ||
      s.name?.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '') === link
    )
    if (fuzzy) {
      openSubstance(fuzzy[0], fuzzy[1])
    }
  }

  const grouped = (subs) => {
    const g = {}
    Object.entries(subs).forEach(([key, sub]) => {
      const cat = sub.category || 'other'
      if (!g[cat]) g[cat] = []
      g[cat].push([key, sub])
    })
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b))
  }

  const filtered = Object.entries(substances).filter(([key, sub]) => {
    const q = search.toLowerCase()
    return !q
      || key.includes(q)
      || sub.name?.toLowerCase().includes(q)
      || sub.de_name?.toLowerCase().includes(q)
      || sub.category?.toLowerCase().includes(q)
      || sub.traditional_use?.some(u => u.toLowerCase().includes(q))
  })

  const groupedFiltered = (() => {
    const g = {}
    filtered.forEach(([key, sub]) => {
      const cat = sub.category || 'other'
      if (!g[cat]) g[cat] = []
      g[cat].push([key, sub])
    })
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b))
  })()

  const relevanceColor = (rel) => {
    if (!rel) return { bg: 'bg-gray-100', badge: 'bg-gray-200', text: 'text-gray-700' }
    if (rel.includes('high_positive'))     return { bg: 'bg-green-50',  badge: 'bg-green-200',  text: 'text-green-700' }
    if (rel.includes('moderate_positive')) return { bg: 'bg-lime-50',   badge: 'bg-lime-200',   text: 'text-lime-700' }
    if (rel.includes('neutral'))           return { bg: 'bg-gray-50',   badge: 'bg-gray-200',   text: 'text-gray-700' }
    if (rel.includes('moderate_negative')) return { bg: 'bg-yellow-50', badge: 'bg-yellow-200', text: 'text-yellow-700' }
    if (rel.includes('high_negative'))     return { bg: 'bg-red-50',    badge: 'bg-red-200',    text: 'text-red-700' }
    return { bg: 'bg-gray-50', badge: 'bg-gray-200', text: 'text-gray-700' }
  }

  const relevanceLabel = (rel) => {
    if (!rel) return '?'
    if (rel.includes('high_positive'))     return '+++'
    if (rel.includes('moderate_positive')) return '++'
    if (rel.includes('neutral'))           return '○'
    if (rel.includes('moderate_negative')) return '−−'
    if (rel.includes('high_negative'))     return '−−−'
    return '?'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 shrink-0" style={{ borderColor: 'var(--line)' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>
              🌿 Substance Catalog
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {viewMode === 'list'
                ? `${Object.keys(substances).length} Substanzen · ${filtered.length} sichtbar`
                : 'Substanz-Molekül-Netzwerk als Graph'}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => { setViewMode('list'); setGraphOverview(false) }}
              className="px-3 py-2 rounded-lg text-sm font-semibold border transition"
              style={{
                borderColor: viewMode === 'list' ? 'var(--accent)' : 'var(--line)',
                color: viewMode === 'list' ? 'var(--accent)' : 'var(--muted)',
                background: viewMode === 'list' ? 'rgba(137,180,250,0.1)' : 'transparent',
                borderWidth: viewMode === 'list' ? 2 : 1,
              }}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className="px-3 py-2 rounded-lg text-sm font-semibold border transition flex items-center gap-1.5"
              style={{
                borderColor: viewMode === 'graph' ? 'var(--accent)' : 'var(--line)',
                color: viewMode === 'graph' ? 'var(--accent)' : 'var(--muted)',
                background: viewMode === 'graph' ? 'rgba(137,180,250,0.1)' : 'transparent',
                borderWidth: viewMode === 'graph' ? 2 : 1,
              }}
            >
              <Network size={14} /> Graph
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder={viewMode === 'list' ? 'Substanz suchen...' : 'Substanz für Graph eingeben...'}
            value={viewMode === 'list' ? search : graphQuery}
            onChange={e => viewMode === 'list' ? setSearch(e.target.value) : setGraphQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
            style={{ background: 'var(--glass)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      {/* Content */}
      {viewMode === 'graph' ? (
        <div className="flex-1 overflow-auto">
          {graphQuery.trim() || graphOverview ? (
            <KnowledgeGraph query={graphQuery} />
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Network size={48} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
                <p className="font-semibold" style={{ color: 'var(--muted)' }}>Substanz eingeben</p>
                <p className="text-sm mt-1" style={{ color: 'var(--dim)' }}>z.B. mulungu, ashwagandha, caffeine</p>
                <button
                  onClick={() => setGraphOverview(true)}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold border transition hover:opacity-80"
                  style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  Alle Substanzen anzeigen
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <p className="text-center mt-8" style={{ color: 'var(--muted)' }}>Lädt...</p>
          ) : groupedFiltered.length === 0 ? (
            <p className="text-center mt-8" style={{ color: 'var(--muted)' }}>Keine Substanzen gefunden</p>
          ) : (
            <div className="space-y-4">
              {groupedFiltered.map(([category, subs]) => (
                <div key={category}>
                  <button
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [category]: !prev[category] }))}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition hover:opacity-80"
                    style={{ background: 'var(--glass)', color: 'var(--accent)' }}
                  >
                    <ChevronDown size={16} style={{ transform: expandedGroups[category] ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                    <span className="flex-1 text-left capitalize">{category.replace(/_/g, ' ')}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{subs.length}</span>
                  </button>

                  {expandedGroups[category] && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                      {subs.map(([key, sub]) => {
                        const rel = relevanceColor(sub.relaxation_relevance)
                        return (
                          <button
                            key={key}
                            onClick={() => openSubstance(key, sub)}
                            className={`p-3 rounded-lg border text-left transition-all hover:scale-105 active:scale-95 ${rel.bg}`}
                            style={{ borderColor: 'var(--line)' }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{sub.de_name || sub.name}</h3>
                                <p className="text-xs mt-0.5 italic" style={{ color: 'var(--muted)' }}>{sub.source_plant || sub.name}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded font-bold ml-2 shrink-0 ${rel.badge}`}>
                                {relevanceLabel(sub.relaxation_relevance)}
                              </span>
                            </div>
                            {sub.traditional_use?.length > 0 && (
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                {sub.traditional_use.slice(0, 2).join(' · ')}
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
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="w-full max-h-[90vh] rounded-t-3xl overflow-hidden flex flex-col" style={{ background: 'var(--card)' }}>
            {/* Modal Header */}
            <div className="sticky top-0 border-b p-4 flex items-center justify-between shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
              <div className="flex-1">
                <h2 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{selected.de_name || selected.name}</h2>
                <p className="text-sm mt-0.5 italic" style={{ color: 'var(--muted)' }}>{selected.source_plant || selected.name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:opacity-70 transition">
                <X className="w-5 h-5" style={{ color: 'var(--ink)' }} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b shrink-0" style={{ borderColor: 'var(--line)' }}>
              {[
                { id: 'overview', label: '📋 Übersicht' },
                { id: 'mechanisms', label: '🧬 Wirkweise' },
                { id: 'molecules', label: '🧪 Moleküle' },
                { id: 'vault', label: '📖 Vault' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedTab(tab.id)
                    if ((tab.id === 'molecules' || tab.id === 'mechanisms') && !expandedData && !expandLoading) fetchExpanded(selected.key)
                    if (tab.id === 'vault' && !vaultContent && !vaultLoading) fetchVault(selected.key)
                  }}
                  className="flex-1 py-2.5 text-sm font-semibold border-b-2 transition"
                  style={{
                    color: selectedTab === tab.id ? 'var(--accent)' : 'var(--muted)',
                    borderBottomColor: selectedTab === tab.id ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Overview */}
              {selectedTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg" style={{ background: 'var(--glass)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Beschreibung</p>
                    <p className="text-sm" style={{ color: 'var(--ink)' }}>{selected.description || '—'}</p>
                  </div>

                  {selected.traditional_use?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Traditionelle Anwendung</p>
                      <div className="flex flex-wrap gap-2">
                        {selected.traditional_use.map((u, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs" style={{ background: 'var(--glass)', color: 'var(--ink)' }}>{u}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.mechanism && (
                    <div className="p-3 rounded-lg border-l-4" style={{ background: 'var(--glass)', borderLeftColor: 'var(--accent)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>Mechanismus</p>
                      <p className="text-sm" style={{ color: 'var(--ink)' }}>{selected.mechanism}</p>
                    </div>
                  )}

                  {selected.notes && (
                    <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--glass)', color: 'var(--muted)' }}>
                      📝 {selected.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Wirkweise (Physiological Targets) */}
              {selectedTab === 'mechanisms' && (
                <div className="space-y-6">
                  {expandLoading && <p className="text-sm" style={{ color: 'var(--muted)' }}>Analysiere Wirkwege...</p>}
                  
                  {!expandLoading && expandedData && (
                    <>
                      {/* Physiologische Effekte (Targets) */}
                      {expandedData.targets && expandedData.targets.length > 0 ? (
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--accent)' }}>Physiologische Einflüsse</h3>
                          <div className="space-y-3">
                            {expandedData.targets.map(target => (
                              <div key={target._key} className="p-3 rounded-lg border" style={{ background: 'var(--glass)', borderColor: 'var(--line)' }}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{target.de_name || target.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: 'var(--dim)' }}>{target.category?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="space-y-2">
                                  {target.via.map((v, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                      <span className="shrink-0 mt-0.5">
                                        {v.direction === 'increase' ? '📈' : v.direction === 'decrease' ? '📉' : '🔄'}
                                      </span>
                                      <div>
                                        <p style={{ color: 'var(--ink)' }}>
                                          <span className="font-semibold">{v.mol_name}</span> ({v.direction === 'increase' ? 'erhöht' : 'senkt'})
                                        </p>
                                        {v.mechanism && <p style={{ color: 'var(--muted)' }} className="mt-0.5">{v.mechanism}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-black/5 rounded-2xl">
                          <p className="text-sm" style={{ color: 'var(--muted)' }}>Keine direkten physiologischen Ziele in der KB verknüpft.</p>
                          <p className="text-[10px] mt-2" style={{ color: 'var(--dim)' }}>Verfügbare Moleküle prüfen oder KB-Enrichment anstoßen.</p>
                        </div>
                      )}

                      {/* Interaktionen der Inhaltsstoffe */}
                      {expandedData.interactions && expandedData.interactions.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--accent)' }}>Interaktionen der Wirkstoffe</h3>
                          <div className="space-y-2">
                            {expandedData.interactions.map((inter, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg border text-xs" style={{ background: 'var(--glass)', borderColor: 'var(--line)' }}>
                                <div className="flex items-center gap-1.5 mb-1 font-semibold" style={{ color: 'var(--ink)' }}>
                                  <span>{inter.molecules.join(' + ')}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10">{inter.type}</span>
                                </div>
                                <p style={{ color: 'var(--muted)' }}>{inter.combined_effect}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Molecules */}
              {selectedTab === 'molecules' && (
                <div className="space-y-3">
                  {expandLoading && <p className="text-sm" style={{ color: 'var(--muted)' }}>Lädt Moleküle...</p>}
                  {expandedData?.molecules && expandedData.molecules.map((mol, idx) => (
                    <div key={mol._key || idx} className="p-3 rounded-lg" style={{ background: 'var(--glass)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{mol.de_name || mol.name}</span>
                        {mol.formula && <span className="text-xs font-mono" style={{ color: 'var(--dim)' }}>{mol.formula}</span>}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{mol.name} · {mol.category?.replace(/_/g, ' ')}</p>
                      {mol.functions?.length > 0 && (
                        <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{mol.functions.slice(0, 3).join(' · ')}</p>
                      )}
                      {mol.relaxation_relevance && (
                         <div className="mt-2 text-[10px] font-bold uppercase" style={{ color: 'var(--accent)' }}>
                           Relevanz: {mol.relaxation_relevance.replace(/_/g, ' ')}
                         </div>
                      )}
                    </div>
                  ))}
                  {expandedData && (!expandedData.molecules || expandedData.molecules.length === 0) && (
                    <p style={{ color: 'var(--muted)' }}>Keine Moleküldaten verfügbar</p>
                  )}
                </div>
              )}

              {/* Vault */}
              {selectedTab === 'vault' && (
                <div>
                  {vaultLoading && <p className="text-sm" style={{ color: 'var(--muted)' }}>Vault wird durchsucht...</p>}
                  {!vaultLoading && vaultContent?.notFound && (
                    <div className="p-6 rounded-lg text-center" style={{ background: 'var(--glass)' }}>
                      <BookOpen size={32} style={{ color: 'var(--dim)', margin: '0 auto 8px' }} />
                      <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Kein Vault-Eintrag</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--dim)' }}>Kein passendes Note in Vitaltrainer oder BODY/Kräuter</p>
                    </div>
                  )}
                  {!vaultLoading && vaultContent && !vaultContent.notFound && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
                        <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{vaultContent.title}</span>
                        <span className="text-xs" style={{ color: 'var(--dim)' }}>· {vaultContent.section}</span>
                      </div>
                      <div
                        className="vault-markdown"
                        dangerouslySetInnerHTML={{ __html: vaultContent.html }}
                        style={{ color: 'var(--ink)' }}
                        onClick={handleVaultLinkClick}
                      />
                    </div>
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
