/**
 * @public
 */
// @ts-ignore
import schema from './plugin.schema.json' assert { type: 'json' }
export { schema }
export { VcApiVerifier } from './agent/VcApiVerifier'
export * from './types/IVcApiVerifier'
