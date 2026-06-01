import React, { useState, useEffect, useCallback } from 'react'
import { NoteCard } from './components/NoteCard'
import { NoteModal } from './components/NoteModal'
import { fetchNotes, createNote, updateNote, deleteNote } from './utils/api'
import { decrypt } from './utils/crypto'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

const styles = {
  app: { minHeight: '100vh', position: 'relative' },
  // Scanline effect overlay
  scanline: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: '2px',
    background: 'linear-gradient(transparent, rgba(63,185,80,0.15), transparent)',
    animation: 'scanline 8s linear infinite',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    borderBottom: '1px solid var(--border)',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(13,17,23,0.8)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--green-dim)',
    border: '1px solid var(--green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: 'var(--mono)',
    letterSpacing: '-0.02em',
  },
  logoBadge: {
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '20px',
    background: 'var(--green-dim)',
    color: 'var(--green)',
    fontFamily: 'var(--mono)',
  },
  newBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'var(--green)',
    border: 'none',
    borderRadius: 'var(--radius)',
    color: '#000',
    fontFamily: 'var(--font)',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
    animation: 'fadeIn 0.6s ease both',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: '700',
    fontFamily: 'var(--mono)',
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    marginBottom: '0.75rem',
    color: 'var(--text)',
  },
  heroGreen: {
    color: 'var(--green)',
  },
  heroSub: {
    fontSize: '14px',
    color: 'var(--text2)',
    fontFamily: 'var(--mono)',
    marginBottom: '1.5rem',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  stat: {
    textAlign: 'center',
  },
  statNum: {
    fontSize: '22px',
    fontWeight: '700',
    fontFamily: 'var(--mono)',
    color: 'var(--green)',
    display: 'block',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text3)',
    fontFamily: 'var(--mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  securityBar: {
    display: 'flex',
    gap: '1rem',
    padding: '0.75rem 1rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    animation: 'slideIn 0.4s ease both',
  },
  secItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontFamily: 'var(--mono)',
    color: 'var(--text2)',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--green)',
    animation: 'pulse 2s ease infinite',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: 'var(--text3)',
    fontFamily: 'var(--mono)',
    animation: 'fadeIn 0.5s ease',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    display: 'block',
  },
  emptyTitle: {
    fontSize: '16px',
    color: 'var(--text2)',
    marginBottom: '0.5rem',
  },
  emptyBtn: {
    marginTop: '1.5rem',
    padding: '10px 24px',
    background: 'var(--green)',
    border: 'none',
    borderRadius: 'var(--radius)',
    color: '#000',
    fontFamily: 'var(--font)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    padding: '10px 16px',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    animation: 'fadeIn 0.3s ease',
    zIndex: 200,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '3rem',
    color: 'var(--text2)',
    fontFamily: 'var(--mono)',
    fontSize: '13px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid var(--border2)',
    borderTop: '2px solid var(--green)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }
}

export default function App() {
  const [notes, setNotes] = useState([])
  const [decryptedTitles, setDecryptedTitles] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadNotes = useCallback(async () => {
    try {
      const data = await fetchNotes()
      setNotes(data)
      setError('')
    } catch (e) {
      setError('Could not connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNotes() }, [loadNotes])

  const handleSave = async (noteData) => {
    try {
      if (editingNote) {
        await updateNote(editingNote._id, noteData)
        showToast('Note re-encrypted and saved')
      } else {
        await createNote(noteData)
        showToast('Note encrypted and saved ✓')
      }
      setShowModal(false)
      setEditingNote(null)
      loadNotes()
    } catch (e) {
      showToast('Failed to save note', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    try {
      await deleteNote(id)
      setNotes(prev => prev.filter(n => n._id !== id))
      showToast('Note deleted')
    } catch {
      showToast('Failed to delete', 'error')
    }
  }

  const handleEdit = (note) => {
    setEditingNote(note)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setEditingNote(null)
  }

  return (
    <div style={styles.app}>
      <div style={styles.scanline} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🔐</div>
          <span style={styles.logoText}>SecureVault</span>
          <span style={styles.logoBadge}>E2E</span>
        </div>
        <button
          style={styles.newBtn}
          onClick={() => setShowModal(true)}
          onMouseEnter={e => e.target.style.opacity = '0.85'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          + New Note
        </button>
      </header>

      <main style={styles.main}>
        {/* Hero */}
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>
            Your notes,<br />
            <span style={styles.heroGreen}>encrypted.</span>
          </h1>
          <p style={styles.heroSub}>
            AES-256-GCM · PBKDF2 · Zero knowledge · Browser-side encryption
          </p>
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={styles.statNum}>{notes.length}</span>
              <span style={styles.statLabel}>Notes stored</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>256</span>
              <span style={styles.statLabel}>Bit key size</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>100K</span>
              <span style={styles.statLabel}>PBKDF2 rounds</span>
            </div>
          </div>
        </div>

        {/* Security status bar */}
        <div style={styles.securityBar}>
          <div style={styles.secItem}><div style={styles.dot} />AES-256-GCM encryption</div>
          <div style={styles.secItem}><div style={styles.dot} />PBKDF2 key derivation</div>
          <div style={styles.secItem}><div style={styles.dot} />Server sees only ciphertext</div>
          <div style={styles.secItem}><div style={styles.dot} />Random IV per note</div>
          <div style={styles.secItem}><div style={styles.dot} />Web Crypto API</div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '0.875rem 1rem', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '13px', marginBottom: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        {/* Notes grid */}
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            Loading encrypted notes...
          </div>
        ) : notes.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>🔒</span>
            <div style={styles.emptyTitle}>No encrypted notes yet</div>
            <p>Create your first note. It will be encrypted before leaving your browser.</p>
            <button style={styles.emptyBtn} onClick={() => setShowModal(true)}>
              Create First Note
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {notes.map(note => (
              <NoteCard
                key={note._id}
                note={note}
                decryptedTitle={decryptedTitles[note._id]}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <NoteModal
          note={editingNote}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'error' ? 'var(--red-dim)' : 'var(--green-dim)',
          border: `1px solid ${toast.type === 'error' ? 'var(--red)' : 'var(--green)'}`,
          color: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
        }}>
          {toast.type === 'error' ? '⚠' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  )
}
