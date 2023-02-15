/**
 * @public
 */
import schema from './plugin.schema.json' assert { type: 'json' }

export { schema }
export { ConnectionManager } from './agent/ConnectionManager'
export { AbstractConnectionStore } from './store/AbstractConnectionStore'
export * from './types/IConnectionManager'
