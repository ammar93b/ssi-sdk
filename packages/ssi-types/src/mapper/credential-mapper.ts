import {
  DocumentFormat,
  IPresentation,
  IProof,
  IProofPurpose,
  IProofType,
  IVerifiableCredential,
  IVerifiablePresentation,
  JwtDecodedVerifiableCredential,
  JwtDecodedVerifiablePresentation,
  OriginalType,
  OriginalVerifiableCredential,
  OriginalVerifiablePresentation,
  PresentationFormat,
  UniformVerifiablePresentation,
  W3CVerifiableCredential,
  W3CVerifiablePresentation,
  WrappedVerifiableCredential,
  WrappedVerifiablePresentation,
} from '../types'
import jwt_decode from 'jwt-decode'
import { ObjectUtils } from '../utils'

export class CredentialMapper {
  static decodeVerifiablePresentation(presentation: OriginalVerifiablePresentation): JwtDecodedVerifiablePresentation | IVerifiablePresentation {
    if (CredentialMapper.isJwtEncoded(presentation)) {
      const payload = jwt_decode(presentation as string) as JwtDecodedVerifiablePresentation
      const header = jwt_decode(presentation as string, { header: true }) as Record<string, any>

      payload.vp.proof = {
        type: IProofType.JwtProof2020,
        created: payload.nbf,
        proofPurpose: IProofPurpose.authentication,
        verificationMethod: header['kid'] ?? payload.iss,
        jwt: presentation as string,
      }
      return payload
    } else if (CredentialMapper.isJwtDecodedPresentation(presentation)) {
      return presentation as JwtDecodedVerifiablePresentation
    } else if (CredentialMapper.isJsonLdAsString(presentation)) {
      return JSON.parse(presentation as string) as IVerifiablePresentation
    } else {
      return presentation as IVerifiablePresentation
    }
  }

  static decodeVerifiableCredential(credential: OriginalVerifiableCredential): JwtDecodedVerifiableCredential | IVerifiableCredential {
    if (CredentialMapper.isJwtEncoded(credential)) {
      const payload = jwt_decode(credential as string) as JwtDecodedVerifiableCredential
      const header = jwt_decode(credential as string, { header: true }) as Record<string, any>
      payload.vc.proof = {
        type: IProofType.JwtProof2020,
        created: payload.nbf,
        proofPurpose: IProofPurpose.authentication,
        verificationMethod: header['kid'] ?? payload.iss,
        jwt: credential as string,
      }
      return payload
    } else if (CredentialMapper.isJwtDecodedCredential(credential)) {
      return credential as JwtDecodedVerifiableCredential
    } else if (CredentialMapper.isJsonLdAsString(credential)) {
      return JSON.parse(credential as string) as IVerifiableCredential
    } else {
      return credential as IVerifiableCredential
    }
  }

  static toWrappedVerifiablePresentation(
    originalPresentation: OriginalVerifiablePresentation,
    opts?: { maxTimeSkewInMS?: number }
  ): WrappedVerifiablePresentation {
    const proof = CredentialMapper.getFirstProof(originalPresentation)
    const original =
      typeof originalPresentation !== 'string' && CredentialMapper.hasJWTProofType(originalPresentation) ? proof?.jwt : originalPresentation
    if (!original) {
      throw Error(
        'Could not determine original presentation, probably it was a converted JWT presentation, that is now missing the JWT value in the proof'
      )
    }
    const decoded = CredentialMapper.decodeVerifiablePresentation(original)
    const isJwtEncoded: boolean = CredentialMapper.isJwtEncoded(original)
    const isJwtDecoded: boolean = CredentialMapper.isJwtDecodedPresentation(original)

    const type = isJwtEncoded ? OriginalType.JWT_ENCODED : isJwtDecoded ? OriginalType.JWT_DECODED : OriginalType.JSONLD
    const format: PresentationFormat = isJwtDecoded || isJwtEncoded ? 'jwt_vp' : 'ldp_vp'

    let vp: OriginalVerifiablePresentation
    if (isJwtEncoded || isJwtDecoded) {
      vp = CredentialMapper.jwtDecodedPresentationToUniformPresentation(decoded as JwtDecodedVerifiablePresentation, false, opts)
    } else {
      vp = decoded as IVerifiablePresentation
    }
    if (!vp || !('verifiableCredential' in vp) || !vp.verifiableCredential || vp.verifiableCredential.length === 0) {
      throw Error(`VP needs to have at least one verifiable credential at this point`)
    }
    const vcs: WrappedVerifiableCredential[] = CredentialMapper.toWrappedVerifiableCredentials(
      vp.verifiableCredential /*.map(value => value.original)*/,
      opts
    )

    const presentation = {
      ...vp,
      verifiableCredential: vcs, // We overwrite the verifiableCredentials with wrapped versions, making it an InternalVerifiablePresentation. Note: we keep the singular key name of the vc data model
    } as UniformVerifiablePresentation
    return {
      type,
      format,
      original,
      decoded,
      presentation,
      vcs,
    }
  }

  static toWrappedVerifiableCredentials(
    verifiableCredentials: OriginalVerifiableCredential[],
    opts?: { maxTimeSkewInMS?: number }
  ): WrappedVerifiableCredential[] {
    return verifiableCredentials.map((vc) => CredentialMapper.toWrappedVerifiableCredential(vc, opts))
  }

  static toWrappedVerifiableCredential(
    verifiableCredential: OriginalVerifiableCredential,
    opts?: { maxTimeSkewInMS?: number }
  ): WrappedVerifiableCredential {
    const proof = CredentialMapper.getFirstProof(verifiableCredential)
    const original = CredentialMapper.hasJWTProofType(verifiableCredential) && proof ? proof.jwt ?? verifiableCredential : verifiableCredential
    if (!original) {
      throw Error(
        'Could not determine original credential, probably it was a converted JWT credential, that is now missing the JWT value in the proof'
      )
    }
    const decoded = CredentialMapper.decodeVerifiableCredential(original)

    const isJwtEncoded = CredentialMapper.isJwtEncoded(original)
    const isJwtDecoded = CredentialMapper.isJwtDecodedCredential(original)
    const type = isJwtEncoded ? OriginalType.JWT_ENCODED : isJwtDecoded ? OriginalType.JWT_DECODED : OriginalType.JSONLD

    const credential =
      isJwtEncoded || isJwtDecoded
        ? CredentialMapper.jwtDecodedCredentialToUniformCredential(decoded as JwtDecodedVerifiableCredential, opts)
        : (decoded as IVerifiableCredential)

    const format = isJwtEncoded || isJwtDecoded ? 'jwt_vc' : 'ldp_vc'
    return {
      original,
      decoded,
      format,
      type,
      credential,
    }
  }

  public static isJwtEncoded(original: OriginalVerifiableCredential | OriginalVerifiablePresentation) {
    return ObjectUtils.isString(original) && (original as string).startsWith('ey')
  }

  private static isJsonLdAsString(original: OriginalVerifiableCredential | OriginalVerifiablePresentation) {
    return ObjectUtils.isString(original) && (original as string).includes('@context')
  }

  public static isJwtDecodedCredential(original: OriginalVerifiableCredential): boolean {
    return (<JwtDecodedVerifiableCredential>original)['vc'] !== undefined && (<JwtDecodedVerifiableCredential>original)['iss'] !== undefined
  }

  public static isJwtDecodedPresentation(original: OriginalVerifiablePresentation): boolean {
    return (<JwtDecodedVerifiablePresentation>original)['vp'] !== undefined && (<JwtDecodedVerifiablePresentation>original)['iss'] !== undefined
  }

  static jwtEncodedPresentationToUniformPresentation(
    jwt: string,
    makeCredentialsUniform: boolean = true,
    opts?: { maxTimeSkewInMS?: number }
  ): IPresentation {
    return CredentialMapper.jwtDecodedPresentationToUniformPresentation(jwt_decode(jwt), makeCredentialsUniform, opts)
  }

  static jwtDecodedPresentationToUniformPresentation(
    decoded: JwtDecodedVerifiablePresentation,
    makeCredentialsUniform: boolean = true,
    opts?: { maxTimeSkewInMS?: number }
  ): IVerifiablePresentation {
    const { iss, aud, jti, vp, ...rest } = decoded

    const presentation: IVerifiablePresentation = {
      ...rest,
      ...vp,
    }
    if (makeCredentialsUniform) {
      if (!vp.verifiableCredential) {
        throw Error('Verifiable Presentation should have a verifiable credential at this point')
      }
      presentation.verifiableCredential = vp.verifiableCredential.map((vc) => CredentialMapper.toUniformCredential(vc, opts))
    }
    if (iss) {
      const holder = presentation.holder
      if (holder) {
        if (holder !== iss) {
          throw new Error(`Inconsistent holders between JWT claim (${iss}) and VC value (${holder})`)
        }
      }
      presentation.holder = iss
    }
    if (aud) {
      const verifier = presentation.verifier
      if (verifier) {
        if (verifier !== aud) {
          throw new Error(`Inconsistent holders between JWT claim (${aud}) and VC value (${verifier})`)
        }
      }
      presentation.verifier = aud
    }
    if (jti) {
      const id = presentation.id
      if (id && id !== jti) {
        throw new Error(`Inconsistent VP ids between JWT claim (${jti}) and VP value (${id})`)
      }
      presentation.id = jti
    }
    return presentation
  }

  static toUniformCredential(
    verifiableCredential: OriginalVerifiableCredential,
    opts?: {
      maxTimeSkewInMS?: number
    }
  ): IVerifiableCredential {
    const original =
      typeof verifiableCredential !== 'string' && CredentialMapper.hasJWTProofType(verifiableCredential)
        ? CredentialMapper.getFirstProof(verifiableCredential)?.jwt
        : verifiableCredential
    if (!original) {
      throw Error(
        'Could not determine original credential from passed in credential. Probably because a JWT proof type was present, but now is not available anymore'
      )
    }
    const decoded = CredentialMapper.decodeVerifiableCredential(original)

    const isJwtEncoded: boolean = CredentialMapper.isJwtEncoded(original)
    const isJwtDecoded: boolean = CredentialMapper.isJwtDecodedCredential(original)

    if (isJwtDecoded || isJwtEncoded) {
      return CredentialMapper.jwtDecodedCredentialToUniformCredential(decoded as JwtDecodedVerifiableCredential, opts)
    } else {
      return decoded as IVerifiableCredential
    }
  }

  static toUniformPresentation(
    presentation: OriginalVerifiablePresentation,
    opts?: { maxTimeSkewInMS?: number; addContextIfMissing?: boolean }
  ): IVerifiablePresentation {
    const proof = CredentialMapper.getFirstProof(presentation)
    const original = typeof presentation !== 'string' && CredentialMapper.hasJWTProofType(presentation) ? proof?.jwt : presentation
    if (!original) {
      throw Error(
        'Could not determine original presentation, probably it was a converted JWT presentation, that is now missing the JWT value in the proof'
      )
    }
    const decoded = CredentialMapper.decodeVerifiablePresentation(original)
    const isJwtEncoded: boolean = CredentialMapper.isJwtEncoded(original)
    const isJwtDecoded: boolean = CredentialMapper.isJwtDecodedPresentation(original)
    const uniformPresentation =
      isJwtEncoded || isJwtDecoded
        ? CredentialMapper.jwtDecodedPresentationToUniformPresentation(decoded as JwtDecodedVerifiablePresentation, false)
        : (decoded as IVerifiablePresentation)

    // At time of writing Velocity Networks does not conform to specification. Adding bare minimum @context section to stop parsers from crashing and whatnot
    if (opts?.addContextIfMissing && !uniformPresentation['@context']) {
      uniformPresentation['@context'] = ['https://www.w3.org/2018/credentials/v1']
    }

    uniformPresentation.verifiableCredential = uniformPresentation.verifiableCredential?.map((vc) =>
      CredentialMapper.toUniformCredential(vc, opts)
    ) as IVerifiableCredential[] // We cast it because we IPresentation needs a VC. The internal Credential doesn't have the required Proof anymore (that is intended)
    return uniformPresentation
  }

  static jwtEncodedCredentialToUniformCredential(
    jwt: string,
    opts?: {
      maxTimeSkewInMS?: number
    }
  ): IVerifiableCredential {
    return CredentialMapper.jwtDecodedCredentialToUniformCredential(jwt_decode(jwt), opts)
  }

  static jwtDecodedCredentialToUniformCredential(
    decoded: JwtDecodedVerifiableCredential,
    opts?: { maxTimeSkewInMS?: number }
  ): IVerifiableCredential {
    const { exp, nbf, iss, vc, sub, jti, ...rest } = decoded
    const credential: IVerifiableCredential = {
      ...rest,
      ...vc,
    }

    const maxSkewInMS = opts?.maxTimeSkewInMS !== undefined ? opts.maxTimeSkewInMS : 999

    if (exp) {
      const expDate = credential.expirationDate
      const jwtExp = parseInt(exp.toString())
      // fix seconds to millisecond for the date
      const expDateAsStr = jwtExp < 9999999999 ? new Date(jwtExp * 1000).toISOString().replace(/\.000Z/, 'Z') : new Date(jwtExp).toISOString()
      if (expDate && expDate !== expDateAsStr) {
        const diff = Math.abs(new Date(expDateAsStr).getTime() - new Date(expDate).getTime())
        if (!maxSkewInMS || diff > maxSkewInMS) {
          throw new Error(`Inconsistent expiration dates between JWT claim (${expDateAsStr}) and VC value (${expDate})`)
        }
      }
      credential.expirationDate = expDateAsStr
    }

    if (nbf) {
      const issuanceDate = credential.issuanceDate
      const jwtNbf = parseInt(nbf.toString())
      // fix seconds to millisecs for the date
      const nbfDateAsStr = jwtNbf < 9999999999 ? new Date(jwtNbf * 1000).toISOString().replace(/\.000Z/, 'Z') : new Date(jwtNbf).toISOString()
      if (issuanceDate && issuanceDate !== nbfDateAsStr) {
        const diff = Math.abs(new Date(nbfDateAsStr).getTime() - new Date(issuanceDate).getTime())
        if (!maxSkewInMS || diff > maxSkewInMS) {
          throw new Error(`Inconsistent issuance dates between JWT claim (${nbfDateAsStr}) and VC value (${issuanceDate})`)
        }
      }
      credential.issuanceDate = nbfDateAsStr
    }

    if (iss) {
      const issuer = credential.issuer
      if (issuer) {
        if (typeof issuer === 'string') {
          if (issuer !== iss) {
            throw new Error(`Inconsistent issuers between JWT claim (${iss}) and VC value (${issuer})`)
          }
        } else {
          if (issuer.id !== iss) {
            throw new Error(`Inconsistent issuers between JWT claim (${iss}) and VC value (${issuer.id})`)
          }
        }
      } else {
        credential.issuer = iss
      }
    }

    if (sub) {
      const subjects = Array.isArray(credential.credentialSubject) ? credential.credentialSubject : [credential.credentialSubject]
      for (let i = 0; i < subjects.length; i++) {
        const csId = subjects[i].id
        if (csId && csId !== sub) {
          throw new Error(`Inconsistent credential subject ids between JWT claim (${sub}) and VC value (${csId})`)
        }
        Array.isArray(credential.credentialSubject) ? (credential.credentialSubject[i].id = sub) : (credential.credentialSubject.id = sub)
      }
    }
    if (jti) {
      const id = credential.id
      if (id && id !== jti) {
        throw new Error(`Inconsistent credential ids between JWT claim (${jti}) and VC value (${id})`)
      }
      credential.id = jti
    }

    return credential
  }

  static toExternalVerifiableCredential(verifiableCredential: any): IVerifiableCredential {
    let proof
    if (verifiableCredential.proof) {
      if (!verifiableCredential.proof.type) {
        throw new Error('Verifiable credential proof is missing a type')
      }

      if (!verifiableCredential.proof.created) {
        throw new Error('Verifiable credential proof is missing a created date')
      }

      if (!verifiableCredential.proof.proofPurpose) {
        throw new Error('Verifiable credential proof is missing a proof purpose')
      }

      if (!verifiableCredential.proof.verificationMethod) {
        throw new Error('Verifiable credential proof is missing a verification method')
      }
      proof = {
        ...verifiableCredential.proof,
        type: verifiableCredential.proof.type,
        created: verifiableCredential.proof.created,
        proofPurpose: verifiableCredential.proof.proofPurpose,
        verificationMethod: verifiableCredential.proof.verificationMethod,
      }
    }

    return {
      ...verifiableCredential,
      type: verifiableCredential.type
        ? typeof verifiableCredential.type === 'string'
          ? [verifiableCredential.type]
          : verifiableCredential.type
        : ['VerifiableCredential'],
      proof,
    }
  }

  static storedCredentialToOriginalFormat(credential: W3CVerifiableCredential): W3CVerifiableCredential {
    const type: DocumentFormat = CredentialMapper.detectDocumentType(credential)
    if (typeof credential === 'string') {
      if (type === DocumentFormat.JWT) {
        return CredentialMapper.toCompactJWT(credential)
      } else if (type === DocumentFormat.JSONLD) {
        return JSON.parse(credential)
      }
    }
    return credential
  }

  static storedPresentationToOriginalFormat(presentation: W3CVerifiablePresentation): W3CVerifiablePresentation {
    const type: DocumentFormat = CredentialMapper.detectDocumentType(presentation)
    if (typeof presentation === 'string') {
      if (type === DocumentFormat.JWT) {
        return CredentialMapper.toCompactJWT(presentation)
      } else if (type === DocumentFormat.JSONLD) {
        return JSON.parse(presentation)
      }
    }
    return presentation
  }

  static toCompactJWT(
    jwtDocument: W3CVerifiableCredential | JwtDecodedVerifiableCredential | W3CVerifiablePresentation | JwtDecodedVerifiablePresentation | string
  ): string {
    if (!jwtDocument || CredentialMapper.detectDocumentType(jwtDocument) !== DocumentFormat.JWT) {
      throw Error('Cannot convert non JWT credential to JWT')
    }
    if (typeof jwtDocument === 'string') {
      return jwtDocument
    }
    let proof: string | undefined
    if ('vp' in jwtDocument) {
      proof = jwtDocument.vp.proof
    } else if ('vc' in jwtDocument) {
      proof = jwtDocument.vc.proof
    } else {
      proof = Array.isArray(jwtDocument.proof) ? jwtDocument.proof[0].jwt : jwtDocument.proof.jwt
    }
    if (!proof) {
      throw Error(`Could not get JWT from supplied document`)
    }
    return proof
  }

  static detectDocumentType(
    document: W3CVerifiableCredential | W3CVerifiablePresentation | JwtDecodedVerifiableCredential | JwtDecodedVerifiablePresentation
  ): DocumentFormat {
    if (typeof document === 'string') {
      return this.isJsonLdAsString(document) ? DocumentFormat.JSONLD : DocumentFormat.JWT
    }
    const proofs = 'vc' in document ? document.vc.proof : 'vp' in document ? document.vp.proof : (<IVerifiableCredential>document).proof
    const proof: IProof = Array.isArray(proofs) ? proofs[0] : proofs

    if (proof?.jwt) {
      return DocumentFormat.JWT
    } else if (proof?.type === 'EthereumEip712Signature2021') {
      return DocumentFormat.EIP712
    }
    return DocumentFormat.JSONLD
  }

  private static hasJWTProofType(
    document: W3CVerifiableCredential | W3CVerifiablePresentation | JwtDecodedVerifiableCredential | JwtDecodedVerifiablePresentation
  ): boolean {
    if (typeof document === 'string') {
      return false
    }
    return !!CredentialMapper.getFirstProof(document)?.jwt
  }

  private static getFirstProof(
    document: W3CVerifiableCredential | W3CVerifiablePresentation | JwtDecodedVerifiableCredential | JwtDecodedVerifiablePresentation
  ): IProof | undefined {
    if (!document || typeof document === 'string') {
      return undefined
    }
    const proofs = 'vc' in document ? document.vc.proof : 'vp' in document ? document.vp.proof : (<IVerifiableCredential>document).proof
    return Array.isArray(proofs) ? proofs[0] : proofs
  }
}
