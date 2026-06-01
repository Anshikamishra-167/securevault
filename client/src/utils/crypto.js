/**
 * crypto.js — AES-256-GCM encryption using the browser's Web Crypto API
 *
 * HOW IT WORKS:
 * 1. User enters a password
 * 2. We derive a 256-bit AES key from the password using PBKDF2
 *    (100,000 iterations of SHA-256 with a random salt)
 * 3. We encrypt note content with AES-GCM using a random IV
 * 4. Only the encrypted blob + IV + salt go to the server
 * 5. The server NEVER sees the password or plaintext
 *
 * WHY AES-GCM:
 * - Authenticated encryption: detects tampering
 * - Industry standard (used in TLS, Signal, etc.)
 * - Built into every modern browser via Web Crypto API
 * - No external libraries needed = zero dependencies
 */

const ITERATIONS = 100000 // PBKDF2 iterations — higher = more secure, slower

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert ArrayBuffer to base64 string for JSON transport */
function bufToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

/** Convert base64 string back to ArrayBuffer */
function base64ToBuf(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer
}

// ── Key Derivation ────────────────────────────────────────────────────────────

/**
 * Derive an AES-GCM CryptoKey from a password + salt using PBKDF2.
 * This is a one-way process — you can't get the password back from the key.
 */
async function deriveKey(password, salt) {
  // Step 1: Import the raw password as a PBKDF2 key
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false, // not extractable
    ['deriveKey']
  )

  // Step 2: Derive the actual AES-256 key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable — key never leaves the browser
    ['encrypt', 'decrypt']
  )
}

// ── Encrypt ───────────────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string with a password.
 * Returns: { encrypted (base64), iv (base64), salt (base64) }
 *
 * Each call generates a fresh random IV and salt — same text encrypted
 * twice will produce completely different ciphertexts (perfect forward secrecy).
 */
export async function encrypt(plaintext, password) {
  // Generate random 16-byte salt and 12-byte IV
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

// ── Decrypt ───────────────────────────────────────────────────────────────────

/**
 * Decrypt an encrypted blob using the password + stored IV + salt.
 * Throws an error if the password is wrong (AES-GCM authentication fails).
 */
export async function decrypt(encryptedBase64, ivBase64, saltBase64, password) {
  const iv = base64ToBuf(ivBase64)
  const salt = base64ToBuf(saltBase64)
  const encrypted = base64ToBuf(encryptedBase64)

  const key = await deriveKey(password, salt)

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    // AES-GCM throws DOMException if authentication fails (wrong password or tampered data)
    throw new Error('Wrong password or corrupted note')
  }
}

// ── Verify Password ───────────────────────────────────────────────────────────

/**
 * Try to decrypt a note to verify the password is correct.
 * Returns true/false — doesn't throw.
 */
export async function verifyPassword(encryptedBase64, ivBase64, saltBase64, password) {
  try {
    await decrypt(encryptedBase64, ivBase64, saltBase64, password)
    return true
  } catch {
    return false
  }
}
