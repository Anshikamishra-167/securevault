# SecureVault 🔐

> End-to-end encrypted notes. Your browser encrypts everything before it leaves your device.

**Live Demo → [securevault.netlify.app](https://securevault.netlify.app)**

---

## How the encryption works

```
Your password
     ↓
  PBKDF2 (100,000 rounds, SHA-256, random salt)
     ↓
  AES-256-GCM key (never leaves browser)
     ↓
  Encrypt(note title + content)
     ↓
  Encrypted blob → sent to server → stored in MongoDB
```

The server **never** sees your password or plaintext. It only stores base64-encoded ciphertext + the IV and salt (both safe to store publicly).

---

## Tech Stack

**Frontend**
- React + Vite
- Web Crypto API (built into every modern browser — zero external crypto libraries)
- AES-256-GCM encryption
- PBKDF2 key derivation (100,000 iterations)

**Backend**
- Node.js + Express
- MongoDB (via Mongoose)
- Only stores encrypted blobs — zero knowledge architecture

---

## Key Security Features

- **AES-256-GCM** — authenticated encryption, detects tampering
- **PBKDF2** — password hardening, 100K rounds of SHA-256
- **Random IV per note** — same text encrypted twice = different ciphertext
- **Random salt per note** — prevents rainbow table attacks
- **Zero knowledge** — server cannot decrypt any note
- **No external crypto libraries** — Web Crypto API is audited browser code

---

## Quick Start

```bash
# Terminal 1 — backend
cd server
npm install
# Create .env from .env.example, add MongoDB URI
npm run dev

# Terminal 2 — frontend
cd client
npm install
npm run dev
```

Open: http://localhost:5174

---

## Built by

**Anshika Mishra** — B.Tech CSE (Cybersecurity & Digital Forensics), VIT Bhopal

[Portfolio](https://anshika-mishra-portfolio.netlify.app) · [LinkedIn](https://linkedin.com/in/anshika-mishra268) · [GitHub](https://github.com/Anshikamishra-167)
