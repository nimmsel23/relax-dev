// Local (API) build barrel — re-exports local/* + shared/* symbols.
// Vite alias: '@db' → this file in default (non-firebase) builds.

export * from './local/core.js'
export * from './local/sessions.js'
export * from './shared/utils.js'
