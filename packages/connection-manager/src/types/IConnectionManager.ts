import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  BasicPartyIdentifier,
  IBasicConnection,
  IConnection,
  IConnectionParty,
  PartyEntity
} from '@sphereon/ssi-sdk-data-store-common'
import { FindOptionsWhere } from 'typeorm'

export interface IConnectionManager extends IPluginMethodMap {
  cmGetParty(args: IGetPartyArgs, context: IRequiredContext): Promise<IConnectionParty>
  cmGetParties(args?: IGetPartiesArgs): Promise<Array<IConnectionParty>>
  cmAddParty(args: IAddPartyArgs, context: IRequiredContext): Promise<IConnectionParty>
  cmUpdateParty(args: IUpdatePartyArgs, context: IRequiredContext): Promise<IConnectionParty>
  cmRemoveParty(args: IRemovePartyArgs, context: IRequiredContext): Promise<boolean>
  cmGetConnection(args: IGetConnectionArgs, context: IRequiredContext): Promise<IConnection>
  cmGetConnections(args: IGetConnectionsArgs, context: IRequiredContext): Promise<Array<IConnection>>
  cmAddConnection(args: IAddConnectionArgs, context: IRequiredContext): Promise<IConnection>
  cmUpdateConnection(args: IUpdateConnectionArgs, context: IRequiredContext): Promise<IConnection>
  cmRemoveConnection(args: IRemoveConnectionArgs, context: IRequiredContext): Promise<boolean>
}

export interface IGetPartyArgs {
  partyId: string
}

export interface IGetPartiesArgs {
  filter?: FindPartyArgs
}

export interface IAddPartyArgs {
  name: string
  alias: string
  identifier: BasicPartyIdentifier
  uri?: string
}

export interface IUpdatePartyArgs {
  party: IConnectionParty
}

export interface IRemovePartyArgs {
  partyId: string
}

export interface IGetConnectionArgs {
  connectionId: string
}

export interface IGetConnectionsArgs {
  partyId: string
}

export interface IAddConnectionArgs {
  partyId: string
  connection: IBasicConnection
}

export interface IUpdateConnectionArgs {
  connection: IConnection
}

export interface IRemoveConnectionArgs {
  connectionId: string
}

export type FindPartyArgs = FindOptionsWhere<PartyEntity>[]

export type IRequiredContext = IAgentContext<never>
