import { IAgentPlugin } from '@veramo/core'

import {
  CreateElementArgs,
  CreateValueArgs,
  DIDCommV2OOBInvitationData,
  IQRCodeGenerator,
  IRequiredContext,
  OpenID4VCIDataWithScheme,
  QRType,
  SIOPv2DataWithScheme,
  URIData,
} from '../types/IQRCodeGenerator'
import { DidCommOutOfBandMessage, generateQRCodeReactElement } from './utils'
import { generateQRCodeReactElementImpl } from './utils/ReactQr'

/**
 * {@inheritDoc IQRCodeGenerator}
 */
export class QrCodeProvider implements IAgentPlugin {
  readonly methods: IQRCodeGenerator = {
    qrDIDCommOobInvitationElement: QrCodeProvider.qrDIDCommOobInvitationElement.bind(this),
    qrDIDCommOobInvitationValue: QrCodeProvider.qrDIDCommOobInvitationValue.bind(this),
    qrSIOPv2Element: QrCodeProvider.qrSIOPv2Element.bind(this),
    qrSIOPv2Value: QrCodeProvider.qrSIOPv2Value.bind(this),
    qrURIElement: QrCodeProvider.qrURIElement.bind(this),
    qrOpenID4VCIElement: QrCodeProvider.qrOpenID4VCIElement.bind(this),
    qrOpenID4VCIValue: QrCodeProvider.qrOpenID4VCIValue.bind(this),
  }

  /** {@inheritDoc IQRCodeGenerator.uriElement} */

  private static async qrURIElement(args: CreateElementArgs<QRType.URI, URIData>, context: IRequiredContext): Promise<JSX.Element> {
    return generateQRCodeReactElement(args, context)
  }

  /** {@inheritDoc IQRCodeGenerator.didCommOobInvitationValue} */
  private static async qrDIDCommOobInvitationValue(
    args: CreateValueArgs<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData>,
    context: IRequiredContext
  ): Promise<string> {
    const { object } = args.data
    const encoded = DidCommOutOfBandMessage.urlEncode(object.oobInvitation)
    const delim = object.baseURI.includes('?') ? '&' : '?'
    return object.baseURI.includes('oob=') ? object.baseURI.replace('oob=', `oob=${encoded}`) : `${object.baseURI}${delim}_oob=${encoded}`
  }

  /** {@inheritDoc IQRCodeGenerator.didCommOobInvitationElement} */
  private static async qrDIDCommOobInvitationElement(
    args: CreateElementArgs<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData>,
    context: IRequiredContext
  ): Promise<JSX.Element> {
    const content = await QrCodeProvider.qrDIDCommOobInvitationValue(args, context)
    return generateQRCodeReactElementImpl(
      {
        ...args,
        data: { ...args.data, object: content },
      } as CreateElementArgs<QRType.DIDCOMM_V2_OOB_INVITATION, string>,
      args,
      context
    )
  }

  /** {@inheritDoc IQRCodeGenerator.siopv2Value} */
  private static async qrSIOPv2Value(args: CreateValueArgs<QRType.SIOPV2, SIOPv2DataWithScheme>, context: IRequiredContext): Promise<string> {
    const { object } = args.data
    if (typeof object === 'string') {
      return object
    }

    const scheme = (object.scheme ?? 'openid-vc://').replace('://?', '').replace('://', '') + '://'
    const requestUri = `request_uri=${object.requestUri.replace('request_uri=', '')}`
    return `${scheme}?${requestUri}`
  }

  /** {@inheritDoc IQRCodeGenerator.siopv2Element} */
  private static async qrSIOPv2Element(
    args: CreateElementArgs<QRType.SIOPV2, SIOPv2DataWithScheme>,
    context: IRequiredContext
  ): Promise<JSX.Element> {
    const content = await QrCodeProvider.qrSIOPv2Value(args, context)
    return generateQRCodeReactElementImpl(
      { ...args, data: { ...args.data, object: content } } as CreateElementArgs<QRType.SIOPV2, string>,
      args,
      context
    )
  }

  /** {@inheritDoc IQRCodeGenerator.qrOpenID4VCIElement} */
  private static async qrOpenID4VCIElement(args: CreateElementArgs<QRType.OIDC4VCI, any>, context: IRequiredContext): Promise<JSX.Element> {
    const content = await QrCodeProvider.qrOpenID4VCIValue(args, context)
    return generateQRCodeReactElementImpl(
      { ...args, data: { ...args.data, object: content } } as CreateElementArgs<QRType.OIDC4VCI, string>,
      args,
      context
    )
  }

  /** {@inheritDoc IQRCodeGenerator.qrOpenID4VCIValue} */
  private static async qrOpenID4VCIValue(
    args: CreateValueArgs<QRType.OIDC4VCI, OpenID4VCIDataWithScheme>,
    context: IRequiredContext
  ): Promise<string> {
    const { object } = args.data
    if (typeof object === 'string') {
      return object
    }
    if (!object.credentialOffer && !object.credentialOfferUri) {
      throw new Error('Please provide credential_offer or credential_offer_uri')
    }
    const scheme = (object.scheme ?? 'openid-credential-offer://').replace('://?', '').replace('://', '') + '://'
    const domain = object.domain ?? ''
    const path = object.path ?? ''
    const credentialOfferUri = `?credential_offer_uri=${object.credentialOfferUri?.replace('credential_offer_uri=', '')}`
    const credentialOffer = `?credential_offer=${object.credentialOffer?.replace('credential_offer=', '')}`
    const value = object.credentialOffer ? credentialOffer : credentialOfferUri
    return `${scheme}${domain}${path}${value}`
  }
}
