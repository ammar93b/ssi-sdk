import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { jest } from '@jest/globals'

jest.setTimeout(30000)

import vcApiIssuerAgentLogic from './shared/vcApiIssuerAgentLogic'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/vc-api-issuer/agent.yml')
  config.agent.$args[0].plugins[0].$args[0].authorizationToken = process.env.VC_HTTP_API_AUTH_TOKEN
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent

  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const getAgent = () => agent
const testContext = { getAgent, setup, tearDown }

describe('Local integration tests', () => {
  vcApiIssuerAgentLogic(testContext)
})
