/**
 * @public
 */
import schema from './plugin.schema.json' assert { type: 'json' }
export { schema }
export { DidAuthSiopOpAuthenticator } from './agent/DidAuthSiopOpAuthenticator'
export { OpSession } from './session/OpSession'
export * from './types/IDidAuthSiopOpAuthenticator'
