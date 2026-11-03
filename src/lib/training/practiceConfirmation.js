export function practiceCandidateKey(candidate) {
  return `${candidate.date}:index:${candidate._sessionItemIndex}`
}

export function confirmPracticeCandidate(items, candidate) {
  if (!Array.isArray(items) || JSON.stringify(items) !== candidate._sessionDaySnapshot) return null
  const index = candidate._sessionItemIndex
  if (!Number.isInteger(index) || index < 0 || index >= items.length) return null
  const item = items[index]
  if (!item || typeof item !== 'object' || (item.trainingUnit === true && item.signed === true)) return null
  return items.map((entry, itemIndex) => itemIndex === index ? { ...entry, trainingUnit: true, signed: true } : entry)
}
