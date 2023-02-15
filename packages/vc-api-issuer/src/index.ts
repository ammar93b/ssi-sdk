/**
 * @public
 */
import schema from './plugin.schema.json' assert { type: 'json' }

export { schema }
export { VcApiIssuer } from './agent/VcApiIssuer'
export * from './types/IVcApiIssuer'
