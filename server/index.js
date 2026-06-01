require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const notesRoute = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '1mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

app.use('/api/notes', notesRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SecureVault server running' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
