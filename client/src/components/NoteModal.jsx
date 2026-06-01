import React, { useState, useEffect } from 'react'
import { encrypt, decrypt } from '../utils/crypto'

const NOTE_COLORS = ['#3fb950', '#58a6ff', '#bc8cff', '#e3b341', '#f85149', '#79c0ff']

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.75rem',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'fadeIn 0.25s ease',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '20px',
    background: 'var(--green-dim)',
    color: 'var(--green)',
    fontFamily: 'var(--mono)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text2)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
  },
  label: {
    fontSize: '11px',
    fontFamily: 'var(--mono)',
    color: 'var(--text2)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.4rem',
    display: 'block',
  },
  input: {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '0.65rem 0.875rem',
    color: 'var(--text)',
    fontFamily: 'var(--font)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    marginBottom: '1rem',
  },
  textarea: {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '0.65rem 0.875rem',
    color: 'var(--text)',
    fontFamily: 'var(--font)',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '140px',
    lineHeight: 1.6,
    transition: 'border-color 0.2s',
    marginBottom: '1rem',
  },
  colorRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1rem',
  },
  colorDot: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'transform 0.15s',
  },
  divider: {
    borderTop: '1px solid var(--border)',
    margin: '1rem 0',
  },
  securityNote: {
    fontSize: '11px',
    fontFamily: 'var(--mono)',
    color: 'var(--green)',
    background: 'var(--green-dim)',
    borderRadius: 'var(--radius)',
    padding: '0.6rem 0.875rem',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '0.5rem',
  },
  btnPrimary: {
    flex: 1,
    padding: '10px',
    background: 'var(--green)',
    border: 'none',
    borderRadius: 'var(--radius)',
    color: '#000',
    fontFamily: 'var(--font)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnSecondary: {
    flex: 1,
    padding: '10px',
    background: 'transparent',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius)',
    color: 'var(--text2)',
    fontFamily: 'var(--font)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  error: {
    fontSize: '12px',
    color: 'var(--red)',
    fontFamily: 'var(--mono)',
    marginTop: '8px',
  }
}

export function NoteModal({ note, onSave, onClose }) {
  const isEditing = !!note
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [color, setColor] = useState(NOTE_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [decrypting, setDecrypting] = useState(false)

  useEffect(() => {
    if (isEditing) {
      setColor(note.color || NOTE_COLORS[0])
      setDecrypting(true)
    }
  }, [isEditing])

  const handleDecryptForEdit = async () => {
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const decTitle = await decrypt(note.encryptedTitle, note.iv, note.salt, password)
      const decContent = await decrypt(note.encryptedContent, note.contentIv, note.contentSalt, password)
      setTitle(decTitle)
      setContent(decContent)
      setDecrypting(false)
    } catch {
      setError('Wrong password — cannot load note for editing')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!content.trim()) { setError('Content is required'); return }
    if (!password) { setError('Password is required'); return }
    if (!isEditing && password !== confirmPassword) {
      setError('Passwords do not match'); return
    }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return }

    setLoading(true)
    setError('')

    try {
      // Encrypt title — gets its own iv + salt
      const titleResult = await encrypt(title.trim(), password)

      // Encrypt content — gets its own iv + salt (different from title!)
      const contentResult = await encrypt(content.trim(), password)

      // Send all 6 fields to server
      await onSave({
        encryptedTitle: titleResult.encrypted,
        iv: titleResult.iv,
        salt: titleResult.salt,

        encryptedContent: contentResult.encrypted,
        contentIv: contentResult.iv,
        contentSalt: contentResult.salt,

        color,
      })
    } catch (e) {
      setError('Encryption failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const focusStyle = { borderColor: 'var(--green)', boxShadow: '0 0 0 2px rgba(63,185,80,0.1)' }
  const blurStyle = { borderColor: 'var(--border)' }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.title}>
            <span>{isEditing ? '✏️' : '🔐'}</span>
            {isEditing ? 'Edit Note' : 'New Encrypted Note'}
            <span style={styles.badge}>AES-256</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.securityNote}>
          🔒 Your note is encrypted in the browser before leaving your device.
          The server only receives encrypted data — it cannot read your note.
          {isEditing && ' Use the same password you used when creating this note.'}
        </div>

        <label style={styles.label}>Accent Color</label>
        <div style={styles.colorRow}>
          {NOTE_COLORS.map(c => (
            <div
              key={c}
              style={{
                ...styles.colorDot,
                background: c,
                borderColor: color === c ? 'var(--text)' : 'transparent',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        {isEditing && decrypting ? (
          <>
            <label style={styles.label}>Enter your password to load this note</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Password..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)}
              onKeyDown={e => e.key === 'Enter' && handleDecryptForEdit()}
              autoFocus
            />
            {error && <div style={styles.error}>⚠ {error}</div>}
            <button style={styles.btnPrimary} onClick={handleDecryptForEdit} disabled={loading}>
              {loading ? 'Decrypting...' : 'Load Note'}
            </button>
          </>
        ) : (
          <>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              style={styles.input}
              placeholder="Note title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)}
            />

            <label style={styles.label}>Content</label>
            <textarea
              style={styles.textarea}
              placeholder="Write your note here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)}
            />

            <div style={styles.divider} />

            <label style={styles.label}>Encryption Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder={isEditing ? 'Same password used to create...' : 'Choose a strong password...'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e => Object.assign(e.target.style, blurStyle)}
            />

            {!isEditing && (
              <>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  style={styles.input}
                  placeholder="Confirm password..."
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => Object.assign(e.target.style, blurStyle)}
                />
              </>
            )}

            {error && <div style={styles.error}>⚠ {error}</div>}

            <div style={styles.btnRow}>
              <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button
                style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Encrypting & Saving...' : isEditing ? 'Re-encrypt & Save' : 'Encrypt & Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}