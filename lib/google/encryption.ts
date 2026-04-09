import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import type { GoogleTokens } from '@/types'

const ALGORITHM = 'aes-256-gcm'
const SALT = 'fisiogendor-tokens-v1'

function getDerivedKey(): Buffer {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return scryptSync(secret, SALT, 32)
}

export function encryptTokens(tokens: GoogleTokens): string {
  const key = getDerivedKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const plaintext = JSON.stringify(tokens)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':')
}

export function decryptTokens(encrypted: string): GoogleTokens {
  const key = getDerivedKey()
  const [ivHex, authTagHex, dataHex] = encrypted.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return JSON.parse(decrypted.toString('utf8')) as GoogleTokens
}
