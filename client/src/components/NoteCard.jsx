import React, { useState } from 'react'
import { decrypt } from '../utils/crypto'

const styles = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    animation: 'fadeIn 0.3s ease both',
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '3px',
    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '0.4rem',
    fontFamily: 'var(--mono)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  meta: {
    fontSize: '11px',
    color: 'var(--text3)',
    fontFamily: 'var(--mono)',
    marginBottom: '0.75rem',
  },
  preview: {
    fontSize: '12px',
    color: 'var(--text2)',
    lineHeight: 1.5,
  },
  lockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    padding: '2px 7px',
    borderRadius: '20px',
    background: 'var(--green-dim)',
    color: 'var(--green)',
    fontFamily: 'var(--mono)',
    marginBottom: '0.6rem',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    marginTop: '0.75rem',
  },
  btn: {
    flex: 1,
    padding: '6px 10px',
    fontSize: '11px',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    color: 'var(--text2)',
    cursor: 'pointer',
    fontFamily: 'var(--mono)',
    transition: 'all 0.15s',
  },
  decrypted: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: 'var(--surface2)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--green)',
    fontSize: '13px',
    lineHeight: 1.6,
    color: 'var(--text)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  pwInput: {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius)',
    padding: '6px 10px',
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    outline: 'none',
    marginTop: '0.5rem',
  },
  error: {
    fontSize: '11px',
    color: 'var(--red)',
    fontFamily: 'var(--mono)',
    marginTop: '4px',
  }
}

export function NoteCard({ note, onEdit, onDelete }) {
  const [showDecrypt, setShowDecrypt] = useState(false)
  const [password, setPassword] = useState('')
  const [decryptedTitle, setDecryptedTitle] = useState('')
  const [decryptedContent, setDecryptedContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDecrypt = async () => {
    if (!password) return
    setLoading(true)
    setError('')
    try {
      // Decrypt title using title's iv + salt
      const title = await decrypt(
        note.encryptedTitle,
        note.iv,
        note.salt,
        password
      )
      // Decrypt content using content's own iv + salt
      const content = await decrypt(
        note.encryptedContent,
        note.contentIv,
        note.contentSalt,
        password
      )
      setDecryptedTitle(title)
      setDecryptedContent(content)
      setError('')
    } catch (e) {
      setError('Wrong password')
      setDecryptedTitle('')
      setDecryptedContent('')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowDecrypt(false)
    setPassword('')
    setDecryptedTitle('')
    setDecryptedContent('')
    setError('')
  }

  const date = new Date(note.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <div style={styles.card}>
      <div style={{ ...styles.colorBar, background: note.color || '#3fb950' }} />

      <div style={styles.title}>
        <span>🔒</span>
        {decryptedTitle || '••••••••••'}
      </div>

      <div style={styles.meta}>Updated {date}</div>

      <div style={styles.lockBadge}>
        <span>⚡</span> AES-256-GCM encrypted
      </div>

      <div style={styles.preview}>
        {decryptedContent
          ? null
          : <span style={{ opacity: 0.3 }}>{Array(3).fill('▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓').join(' ')}</span>
        }
      </div>

      <div style={styles.actions}>
        <button
          style={styles.btn}
          onClick={() => setShowDecrypt(!showDecrypt)}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--green)'; e.target.style.color = 'var(--green)' }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--text2)' }}
        >
          {showDecrypt && decryptedContent ? 'Lock' : 'Unlock'}
        </button>
        <button
          style={styles.btn}
          onClick={() => onEdit(note)}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.color = 'var(--blue)' }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--text2)' }}
        >
          Edit
        </button>
        <button
          style={styles.btn}
          onClick={() => onDelete(note._id)}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--red)'; e.target.style.color = 'var(--red)' }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--text2)' }}
        >
          Delete
        </button>
      </div>

      {showDecrypt && (
        <div style={{ marginTop: '0.75rem' }}>
          {!decryptedContent ? (
            <>
              <input
                type="password"
                style={styles.pwInput}
                placeholder="Enter password to unlock..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDecrypt()}
                autoFocus
              />
              {error && <div style={styles.error}>⚠ {error}</div>}
              <button
                style={{ ...styles.btn, marginTop: '6px', borderColor: 'var(--green)', color: 'var(--green)' }}
                onClick={handleDecrypt}
                disabled={loading}
              >
                {loading ? 'Decrypting...' : 'Decrypt'}
              </button>
            </>
          ) : (
            <>
              <div style={styles.decrypted}>{decryptedContent}</div>
              <button style={{ ...styles.btn, marginTop: '6px' }} onClick={handleClose}>
                Lock Again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}