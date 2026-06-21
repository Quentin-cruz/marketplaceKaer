require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function(origin, cb) {
    // autorise les requêtes sans origin (ex: ouvrir le fichier directement)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS non autorisé : ' + origin));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use(express.static(require('path').join(__dirname, '..')));
app.use('/uploads', express.static(require('path').join(__dirname, '..', 'uploads')));

app.use('/api/auth',    require('./routes/auth'));
// à venir :
app.use('/api/produits', require('./routes/produits'));
app.use('/api/messages', require('./routes/messages'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Kaer Seller API → http://localhost:${PORT}`));
