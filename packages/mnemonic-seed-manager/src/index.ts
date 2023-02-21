import { MnemonicEntity } from './entities/MnemonicEntity'

// @ts-ignore
import schema from './plugin.schema.json' assert { type: 'json' }
export { schema }
export { MnemonicSeedManager } from './agent/MnemonicSeedManager'
export * from './types/IMnemonicSeedManager'
export const MnemonicSeedManagerEntities = [MnemonicEntity]
export { MnemonicSeedManagerMigrations } from './migrations'
