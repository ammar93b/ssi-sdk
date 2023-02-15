import { DidConfigurationResourceEntity } from './entities/DidConfigurationResourceEntity'

/**
 * @public
 */
import schema from './plugin.schema.json' assert { type: 'json' }
export { schema }
export { WellKnownDidIssuer } from './agent/WellKnownDidIssuer'
export * from './types/IWellKnownDidIssuer'
export const WellknownDidIssuerEntities = [DidConfigurationResourceEntity]
export { WellknownDidIssuerMigrations } from './migrations'
