import React, { useState, useEffect, useRef } from 'react'
import { encrypt, decrypt } from '../utils/crypto'

const NOTE_COLORS = ['#3fb950', '#58a6ff', '#bc8cff', '#e3b341', '#f85149', '#79c0ff']

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  htitle: { fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
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
  btnP: { flex: 1, padding: '10px', background: 'var(--green)', border: 'none', borderRadius: 'var(--radius)', color: '#000', fontFamily: 'var(--font)', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  btnS: { flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontFamily: 'var(--font)', fontSize: '14px', cursor: 'pointer' },
  err: { fontSize: '12px', color: 'var(--red)', fontFamily: 'var(--mono)', marginBottom: '8px' },
}

export function NoteModal({ note, onSave, onClose }) {
  const isEditing = !!note

  // For editing: step 1 unlock
  const [unlockPw, setUnlockPw] = useState('')
  const [unlockErr, setUnlockErr] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  // Note content
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState(NOTE_COLORS[0])

  // For saving: new password
  const [savePw, setSavePw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saveErr, setSaveErr] = useState('')
  const [saving, setSaving] = useState(false)

  // Store the unlock password in a ref so it's immediately available
  // React state updates are async — refs are synchronous
  const unlockPwRef = useRef('')

  useEffect(() => {
    if (note) setColor(note.color || NOTE_COLORS[0])
  }, [note])

  const handleUnlock = async () => {
    if (!unlockPw) { setUnlockErr('Enter your password'); return }
    setUnlocking(true)
    setUnlockErr('')
    try {
      const decTitle = await decrypt(note.encryptedTitle, note.iv, note.salt, unlockPw)
      const decContent = await decrypt(note.encryptedContent, note.contentIv, note.contentSalt, unlockPw)
      setTitle(decTitle)
      setContent(decContent)
      // Store in ref immediately — ref is synchronous unlike setState
      unlockPwRef.current = unlockPw
      // Pre-fill save password field with same password
      setSavePw(unlockPw)
      setConfirmPw(unlockPw)
      setUnlocked(true)
    } catch {
      setUnlockErr('Wrong password')
    } finally {
      setUnlocking(false)
    }
  }

  const handleSave = async () => {
    // Use savePw field value — user can change it or keep same
    const passwordToUse = savePw

    if (!title.trim()) { setSaveErr('Title is required'); return }
    if (!content.trim()) { setSaveErr('Content is required'); return }
    if (!passwordToUse) { setSaveErr('Password is required'); return }
    if (!isEditing && passwordToUse !== confirmPw) { setSaveErr('Passwords do not match'); return }
    if (passwordToUse.length < 4) { setSaveErr('Password must be at least 4 characters'); return }

    setSaving(true)
    setSaveErr('')
    try {
      const titleResult = await encrypt(title.trim(), passwordToUse)
      const contentResult = await encrypt(content.trim(), passwordToUse)

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
      setSaveErr('Failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const focus = { borderColor: 'var(--green)' }
  const blur = { borderColor: 'var(--border)' }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        <div style={s.header}>
          <div style={s.htitle}>
            <span>{isEditing ? '✏️' : '🔐'}</span>
            {isEditing ? 'Edit Note' : 'New Encrypted Note'}
            <span style={s.badge}>AES-256</span>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.secNote}>
          🔒 Encrypted in your browser. Server never sees plaintext.
        </div>

        {/* Color picker */}
        <label style={s.label}>Accent Color</label>
        <div style={s.colorRow}>
          {NOTE_COLORS.map(c => (
            <div key={c} style={{ ...s.colorDot, background: c, borderColor: color === c ? '#fff' : 'transparent', transform: color === c ? 'scale(1.2)' : 'scale(1)' }} onClick={() => setColor(c)} />
          ))}
        </div>

        {/* EDIT MODE: unlock first */}
        {isEditing && !unlocked && (
          <>
            <label style={s.label}>Enter password to unlock note</label>
            <input
              type="password"
              style={s.input}
              placeholder="Password used when creating..."
              value={unlockPw}
              onChange={e => setUnlockPw(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focus)}
              onBlur={e => Object.assign(e.target.style, blur)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />
            {unlockErr && <div style={s.err}>⚠ {unlockErr}</div>}
            <div style={s.btnRow}>
              <button style={s.btnS} onClick={onClose}>Cancel</button>
              <button style={s.btnP} onClick={handleUnlock} disabled={unlocking}>
                {unlocking ? 'Unlocking...' : 'Unlock to Edit'}
              </button>
            </div>
          </>
        )}

        {/* NEW NOTE or after unlock */}
        {(!isEditing || unlocked) && (
          <>
            <label style={s.label}>Title</label>
            <input
              type="text" style={s.input} placeholder="Note title..."
              value={title} onChange={e => setTitle(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focus)}
              onBlur={e => Object.assign(e.target.style, blur)}
              autoFocus={!isEditing}
            />

            <label style={s.label}>Content</label>
            <textarea
              style={s.textarea} placeholder="Write your note here..."
              value={content} onChange={e => setContent(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focus)}
              onBlur={e => Object.assign(e.target.style, blur)}
            />

            <div style={s.divider} />

            <label style={s.label}>
              {isEditing ? 'Save password (pre-filled with unlock password)' : 'Encryption Password'}
            </label>
            <input
              type="password" style={s.input}
              placeholder={isEditing ? 'Change or keep the same password...' : 'Choose a strong password...'}
              value={savePw}
              onChange={e => setSavePw(e.target.value)}
              onFocus={e => Object.assign(e.target.style, focus)}
              onBlur={e => Object.assign(e.target.style, blur)}
            />

            {!isEditing && (
              <>
                <label style={s.label}>Confirm Password</label>
                <input
                  type="password" style={s.input} placeholder="Confirm password..."
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  onFocus={e => Object.assign(e.target.style, focus)}
                  onBlur={e => Object.assign(e.target.style, blur)}
                />
              </>
            )}

            {saveErr && <div style={s.err}>⚠ {saveErr}</div>}

            <div style={s.btnRow}>
              <button style={s.btnS} onClick={onClose}>Cancel</button>
              <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Encrypting & Saving...' : isEditing ? 'Re-encrypt & Save' : 'Encrypt & Save'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}