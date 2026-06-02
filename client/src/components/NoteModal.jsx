import React, { useState, useEffect } from 'react'
import { encrypt, decrypt } from '../utils/crypto'

const NOTE_COLORS = ['#3fb950', '#58a6ff', '#bc8cff', '#e3b341', '#f85149', '#79c0ff']

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '1rem',
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border2)',
    borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: '100%',
    maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto',
    animation: 'fadeIn 0.25s ease',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title: { fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
  badge: { fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'var(--green-dim)', color: 'var(--green)', fontFamily: 'var(--mono)' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' },
  label: { fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'block' },
  input: { width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.65rem 0.875rem', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', outline: 'none', marginBottom: '1rem' },
  textarea: { width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.65rem 0.875rem', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '140px', lineHeight: 1.6, marginBottom: '1rem' },
  colorRow: { display: 'flex', gap: '8px', marginBottom: '1rem' },
  colorDot: { width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', border: '2px solid transparent', transition: 'transform 0.15s' },
  divider: { borderTop: '1px solid var(--border)', margin: '1rem 0' },
  secNote: { fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--green)', background: 'var(--green-dim)', borderRadius: 'var(--radius)', padding: '0.6rem 0.875rem', marginBottom: '1rem', lineHeight: 1.5 },
  btnRow: { display: 'flex', gap: '10px', marginTop: '0.5rem' },
  btnPrimary: { flex: 1, padding: '10px', background: 'var(--green)', border: 'none', borderRadius: 'var(--radius)', color: '#000', fontFamily: 'var(--font)', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  btnSecondary: { flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontFamily: 'var(--font)', fontSize: '14px', cursor: 'pointer' },
  error: { fontSize: '12px', color: 'var(--red)', fontFamily: 'var(--mono)', marginTop: '8px', marginBottom: '8px' },
}

export function NoteModal({ note, onSave, onClose }) {
  const isEditing = !!note

  // Step 1: unlock password (only for editing)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  // Step 2: note content
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState(NOTE_COLORS[0])

  // Step 3: save password (used for both new notes and re-encryption on edit)
  const [savePassword, setSavePassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (note) setColor(note.color || NOTE_COLORS[0])
  }, [note])

  // Unlock existing note for editing
  const handleUnlock = async () => {
    if (!unlockPassword) { setUnlockError('Enter your password'); return }
    setUnlocking(true)
    setUnlockError('')
    try {
      const decTitle = await decrypt(note.encryptedTitle, note.iv, note.salt, unlockPassword)
      const decContent = await decrypt(note.encryptedContent, note.contentIv, note.contentSalt, unlockPassword)
      setTitle(decTitle)
      setContent(decContent)
      // Pre-fill save password with same password for convenience
      setSavePassword(unlockPassword)
      setConfirmPassword(unlockPassword)
      setUnlocked(true)
    } catch {
      setUnlockError('Wrong password')
    } finally {
      setUnlocking(false)
    }
  }

  // Save (encrypt and send to server)
  const handleSave = async () => {
    if (!title.trim()) { setSaveError('Title is required'); return }
    if (!content.trim()) { setSaveError('Content is required'); return }
    if (!savePassword) { setSaveError('Password is required'); return }
    if (!isEditing && savePassword !== confirmPassword) { setSaveError('Passwords do not match'); return }
    if (savePassword.length < 4) { setSaveError('Password must be at least 4 characters'); return }

    setSaving(true)
    setSaveError('')
    try {
      // Each field gets its own fresh IV + salt
      const titleResult = await encrypt(title.trim(), savePassword)
      const contentResult = await encrypt(content.trim(), savePassword)

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
      setSaveError('Encryption failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <span>{isEditing ? '✏️' : '🔐'}</span>
            {isEditing ? 'Edit Note' : 'New Encrypted Note'}
            <span style={styles.badge}>AES-256</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.secNote}>
          🔒 Everything is encrypted in your browser before reaching the server.
        </div>

        {/* Color picker — always visible */}
        <label style={styles.label}>Accent Color</label>
        <div style={styles.colorRow}>
          {NOTE_COLORS.map(c => (
            <div key={c} style={{ ...styles.colorDot, background: c, borderColor: color === c ? 'var(--text)' : 'transparent', transform: color === c ? 'scale(1.2)' : 'scale(1)' }} onClick={() => setColor(c)} />
          ))}
        </div>

        {/* EDITING: Step 1 — unlock first */}
        {isEditing && !unlocked && (
          <>
            <label style={styles.label}>Enter password to load note</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Password used when creating..."
              value={unlockPassword}
              onChange={e => setUnlockPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />
            {unlockError && <div style={styles.error}>⚠ {unlockError}</div>}
            <div style={styles.btnRow}>
              <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button style={styles.btnPrimary} onClick={handleUnlock} disabled={unlocking}>
                {unlocking ? 'Unlocking...' : 'Unlock Note'}
              </button>
            </div>
          </>
        )}

        {/* NEW NOTE or EDITING after unlock: show content form */}
        {(!isEditing || unlocked) && (
          <>
            <label style={styles.label}>Title</label>
            <input type="text" style={styles.input} placeholder="Note title..." value={title} onChange={e => setTitle(e.target.value)} autoFocus={!isEditing} />

            <label style={styles.label}>Content</label>
            <textarea style={styles.textarea} placeholder="Write your note here..." value={content} onChange={e => setContent(e.target.value)} />

            <div style={styles.divider} />

            <label style={styles.label}>
              {isEditing ? 'New password to re-encrypt (or keep the same)' : 'Encryption Password'}
            </label>
            <input
              type="password"
              style={styles.input}
              placeholder={isEditing ? 'Password to save with...' : 'Choose a strong password...'}
              value={savePassword}
              onChange={e => setSavePassword(e.target.value)}
            />

            {!isEditing && (
              <>
                <label style={styles.label}>Confirm Password</label>
                <input type="password" style={styles.input} placeholder="Confirm password..." value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </>
            )}

            {saveError && <div style={styles.error}>⚠ {saveError}</div>}

            <div style={styles.btnRow}>
              <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Encrypting & Saving...' : isEditing ? 'Re-encrypt & Save' : 'Encrypt & Save'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}