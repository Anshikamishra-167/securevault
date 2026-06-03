/**
 * crypto.js — AES-256-GCM encryption using Web Crypto API
 * Simplified and bulletproof version
 */

const ITERATIONS = 100000

function bufToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuf(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer
}

async function deriveKey(password, salt) {
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(plaintext, password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  return {
    encrypted: bufToBase64(encrypted),
    iv: bufToBase64(iv),
    salt: bufToBase64(salt)
  }
}

export async function decrypt(encryptedBase64, ivBase64, saltBase64, password) {
  try {
    const iv = base64ToBuf(ivBase64)
    const salt = base64ToBuf(saltBase64)
    const encrypted = base64ToBuf(encryptedBase64)
    const key = await deriveKey(password, salt)
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    throw new Error('Wrong password or corrupted data')
  }
}
// force redeploy Wed Jun  3 02:38:22 UTC 2026