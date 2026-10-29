// Firestore build barrel — re-exports firestore/* + shared/* symbols.
// Vite alias: '@db' → this file when embedded in der VitalOS-Shell (Firebase-Build).

export * from './firestore/core.js'
export * from './firestore/sessions.js'
export * from './shared/utils.js'
