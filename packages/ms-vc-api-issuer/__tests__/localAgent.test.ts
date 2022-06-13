import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'

jest.setTimeout(30000)

import vcApiIssuerAgentLogic from './shared/vcApiIssuerAgentLogic'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/ms-vc-api-issuer/agent.yml')
  const { localAgent } = createObjects(config, { localAgent: '/agent' })
  agent = localAgent

  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const getAgent = () => agent
const testContext = { getAgent, setup, tearDown }

describe('ms-vc-api-isuuer-Local integration tests', () => {
  vcApiIssuerAgentLogic(testContext)
})
