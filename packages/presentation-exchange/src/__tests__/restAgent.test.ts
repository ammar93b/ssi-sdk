import 'cross-fetch/polyfill'
// @ts-ignore
import express from 'express'
import { createAgent, IAgent, IAgentOptions, IDataStore } from '@veramo/core'
import { AgentRestClient } from '@veramo/remote-client'
import { Server } from 'http'
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server'
import { getConfig } from '@veramo/cli/build/setup'
import { createObjects } from '@veramo/cli/build/lib/objectCreator'
import { IPresentationExchange, PresentationExchange } from '../index'
import { Resolver } from 'did-resolver'
import { getDidKeyResolver } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import presentationExchangeAgentLogic from './shared/presentationExchangeAgentLogic'

jest.setTimeout(30000)

const port = 3002
const basePath = '/agent'
let serverAgent: IAgent
let restServer: Server

const getAgent = (options?: IAgentOptions) =>
  createAgent<IPresentationExchange & IDataStore>({
    ...options,
    plugins: [
      new PresentationExchange(),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...getDidKeyResolver(),
        }),
      }),
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  })

const setup = async (): Promise<boolean> => {
  const config = getConfig('packages/presentation-exchange/agent.yml')
  // config.agent.$args[0].plugins[1].$args[0] = presentationSignCallback
  const { agent } = createObjects(config, { agent: '/agent' })
  // agent.registerCustomApprovalForSiop({ key: 'success', customApproval: () => Promise.resolve() })
  // agent.registerCustomApprovalForSiop({ key: 'failure', customApproval: () => Promise.reject(new Error('denied')) })
  serverAgent = agent

  const agentRouter = AgentRouter({
    exposedMethods: serverAgent.availableMethods(),
  })

  const requestWithAgent = RequestWithAgentRouter({
    agent: serverAgent,
  })

  return new Promise((resolve) => {
    const app = express()
    app.use(basePath, requestWithAgent, agentRouter)
    restServer = app.listen(port, () => {
      resolve(true)
    })
  })
}

const tearDown = async (): Promise<boolean> => {
  restServer.close()
  return true
}

const testContext = {
  getAgent,
  setup,
  tearDown,
  isRestTest: true,
}

describe('REST integration tests', () => {
  presentationExchangeAgentLogic(testContext)
})
