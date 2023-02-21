import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import msRequestApiAgentLogic from './shared/msRequestApiAgentLogic'
import { jest } from '@jest/globals'

jest.setTimeout(30000)

let agents: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/ms-request-api/agent.yml')
  const { agent } = await createObjects(config, { localAgent: '/agent' })
  agents = agent
  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const getAgent = () => agent
const testContext = { getAgent, setup, tearDown }

describe('Local integration tests', () => {
  msRequestApiAgentLogic(testContext)
})
