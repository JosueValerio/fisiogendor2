import { describe, it, expect, beforeAll } from 'vitest'
import { encryptTokens, decryptTokens } from '@/lib/google/encryption'
import type { GoogleTokens } from '@/types'

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-for-unit-tests-only'
})

describe('encryptTokens / decryptTokens', () => {
  const tokens: GoogleTokens = {
    access_token: 'ya29.test-access-token',
    refresh_token: '1//test-refresh-token',
    expiry_date: 1700000000000,
  }

  it('round-trip preserva todos os campos', () => {
    const encrypted = encryptTokens(tokens)
    const decrypted = decryptTokens(encrypted)
    expect(decrypted).toEqual(tokens)
  })

  it('formato iv:authTag:ciphertext', () => {
    const encrypted = encryptTokens(tokens)
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toHaveLength(32) // iv 16 bytes → 32 hex
    expect(parts[1]).toHaveLength(32) // authTag 16 bytes → 32 hex
  })

  it('cada cifra é diferente (IV aleatório)', () => {
    const enc1 = encryptTokens(tokens)
    const enc2 = encryptTokens(tokens)
    expect(enc1).not.toBe(enc2)
  })

  it('falha ao tamper no ciphertext', () => {
    const encrypted = encryptTokens(tokens)
    const parts = encrypted.split(':')
    // corromper último byte do ciphertext
    parts[2] = parts[2].slice(0, -2) + 'ff'
    const tampered = parts.join(':')
    expect(() => decryptTokens(tampered)).toThrow()
  })
})
