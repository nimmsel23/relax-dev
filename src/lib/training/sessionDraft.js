const PREFIX = 'relax-practice-draft-v1:'

export function readSessionDraft(storage, date, savedItems) {
  const raw = storage.getItem(PREFIX + date)
  if (!raw) return { status: 'none' }
  try {
    const draft = JSON.parse(raw)
    if (draft.version !== 1 || !Array.isArray(draft.items) || draft.items.some(item => !item || typeof item !== 'object' || Array.isArray(item)) || typeof draft.base !== 'string') return { status: 'invalid' }
    return { status: draft.base === JSON.stringify(savedItems) ? 'restore' : 'conflict', items: draft.items }
  } catch {
    return { status: 'invalid' }
  }
}

export function writeSessionDraft(storage, date, base, items) {
  storage.setItem(PREFIX + date, JSON.stringify({ version: 1, base, items }))
}

export function removeSessionDraft(storage, date) {
  storage.removeItem(PREFIX + date)
}
