import { MnemonicEntity } from './entities/MnemonicEntity'

import schema from './plugin.schema.json' assert { type: 'json' }
export { schema }
export { MnemonicSeedManager } from './agent/MnemonicSeedManager'
export * from './types/IMnemonicSeedManager'
export const MnemonicSeedManagerEntities = [MnemonicEntity]
export { MnemonicSeedManagerMigrations } from './migrations'
