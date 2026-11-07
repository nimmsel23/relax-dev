import { TEACHING_SCRIPT_KEY, PRANAYAMA_ASSIGNMENT_KEY } from './storage.js'

export const STORAGE_KEY = 'relax-training-plan-v1'
export const CASE_STORAGE_KEY = 'relax-stress-case-v1'
export const STRESS_REFLECTION_KEY = 'relax-stress-reflection-v1'
export const DELIVERY_STORAGE_KEY = 'relax-training-delivery-v1'
export const METHOD_REFLECTION_KEY = 'relax-method-reflections-v1'
export const LEARNING_CHECK_KEY = 'relax-learning-check-v1'
export const MODULE_BACKUP_FORMAT = 'relax-ausbildung-arbeitsstand'
export const MODULE_BACKUP_KEYS = [STORAGE_KEY, CASE_STORAGE_KEY, DELIVERY_STORAGE_KEY, STRESS_REFLECTION_KEY, METHOD_REFLECTION_KEY, LEARNING_CHECK_KEY, TEACHING_SCRIPT_KEY, PRANAYAMA_ASSIGNMENT_KEY]

export function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"` }

export function normalizeModuleBackup(backup, learningCheckLength) {
  if (!backup || backup.format !== MODULE_BACKUP_FORMAT || !backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) return null
  if (backup.version === 1) {
    const originalKeys = MODULE_BACKUP_KEYS.filter(key => key !== TEACHING_SCRIPT_KEY && key !== PRANAYAMA_ASSIGNMENT_KEY)
    if (Object.keys(backup.data).length !== originalKeys.length || originalKeys.some(key => !Object.hasOwn(backup.data, key))) return null
    backup = { ...backup, version: 2, data: { ...backup.data, [TEACHING_SCRIPT_KEY]: '', [PRANAYAMA_ASSIGNMENT_KEY]: null } }
  }
  if (backup.version !== 2) return null
  if (MODULE_BACKUP_KEYS.some(key => !Object.hasOwn(backup.data, key))) return null
  if (Object.keys(backup.data).some(key => !MODULE_BACKUP_KEYS.includes(key))) return null
  const { [STORAGE_KEY]: plan, [CASE_STORAGE_KEY]: casePlan, [DELIVERY_STORAGE_KEY]: delivery, [STRESS_REFLECTION_KEY]: stress, [METHOD_REFLECTION_KEY]: methods, [LEARNING_CHECK_KEY]: learning, [TEACHING_SCRIPT_KEY]: breathingScript, [PRANAYAMA_ASSIGNMENT_KEY]: pranayama } = backup.data
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  const valid = isObject(plan) && typeof plan.title === 'string' && Array.isArray(plan.blocks)
    && isObject(casePlan) && Array.isArray(casePlan.weeks) && casePlan.weeks.length === 4 && isObject(casePlan.dayCycle)
    && (casePlan.minimalRoutine === undefined || typeof casePlan.minimalRoutine === 'string')
    && (casePlan.review === undefined || (isObject(casePlan.review) && ['method', 'continue'].every(key => typeof casePlan.review[key] === 'string')))
    && (delivery === null || (isObject(delivery) && Array.isArray(delivery.blocks) && delivery.blocks.length > 0 && Number.isInteger(delivery.index) && delivery.index >= 0 && delivery.index < delivery.blocks.length && Number.isFinite(delivery.remaining) && delivery.remaining >= 0 && typeof delivery.running === 'boolean' && (!delivery.running || Number.isFinite(delivery.endsAt))))
    && isObject(stress) && isObject(methods)
    && isObject(learning) && Number.isInteger(learning.index) && learning.index >= 0 && learning.index <= learningCheckLength && Number.isInteger(learning.score) && learning.score >= 0 && learning.score <= learningCheckLength
    && typeof breathingScript === 'string' && (pranayama === null || (isObject(pranayama) && typeof pranayama.technique === 'string' && ['script', 'rehearsal', 'groupPractice', 'feedback'].every(field => typeof pranayama[field] === 'string')))
  return valid ? backup : null
}

export function restoreDelivery() {
  try {
    const saved = JSON.parse(localStorage.getItem(DELIVERY_STORAGE_KEY) || 'null')
    if (!saved || !Array.isArray(saved.blocks) || !saved.blocks.length || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= saved.blocks.length) return null
    if (!saved.running) {
      const remaining = Number(saved.remaining)
      return Number.isFinite(remaining) && remaining >= 0 ? { ...saved, remaining, running: false, endsAt: null } : null
    }
    const endsAt = Number(saved.endsAt)
    if (!Number.isFinite(endsAt)) return null
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
    return { ...saved, remaining, running: remaining > 0, endsAt: remaining > 0 ? endsAt : null }
  } catch { return null }
}
