/**
 * @public
 */
import schema from './plugin.schema.json' assert { type: 'json' }
export { schema }
export { WellKnownDidVerifier } from './agent/WellKnownDidVerifier'
export * from './types/IWellKnownDidVerifier'
