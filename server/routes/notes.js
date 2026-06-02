const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// GET all notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new note
router.post('/', async (req, res) => {
  try {
    const { encryptedTitle, encryptedContent, iv, salt, contentIv, contentSalt, color } = req.body;
    console.log('Creating note, fields present:', {
      encryptedTitle: !!encryptedTitle,
      encryptedContent: !!encryptedContent,
      iv: !!iv, salt: !!salt,
      contentIv: !!contentIv,
      contentSalt: !!contentSalt
    });
    if (!encryptedTitle || !encryptedContent || !iv || !salt || !contentIv || !contentSalt) {
      return res.status(400).json({ error: 'Missing required encrypted fields' });
    }
    const note = new Note({ encryptedTitle, encryptedContent, iv, salt, contentIv, contentSalt, color });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update note — always save ALL new encryption fields
router.put('/:id', async (req, res) => {
  try {
    const { encryptedTitle, encryptedContent, iv, salt, contentIv, contentSalt, color } = req.body;
    console.log('Updating note, fields present:', {
      encryptedTitle: !!encryptedTitle,
      encryptedContent: !!encryptedContent,
      iv: !!iv, salt: !!salt,
      contentIv: !!contentIv,
      contentSalt: !!contentSalt
    });
    if (!encryptedTitle || !encryptedContent || !iv || !salt || !contentIv || !contentSalt) {
      return res.status(400).json({ error: 'Missing required encrypted fields' });
    }
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      {
        encryptedTitle,
        encryptedContent,
        iv,
        salt,
        contentIv,
        contentSalt,
        color,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE note
router.delete('/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;