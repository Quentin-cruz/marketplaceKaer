const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const SALT_ROUNDS = 12;

function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 jours
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { raison_sociale, siret, email, password } = req.body;

  if (!raison_sociale || !siret || !email || !password)
    return res.status(400).json({ error: 'Tous les champs sont requis' });

  if (!/^\d{14}$/.test(siret))
    return res.status(400).json({ error: 'SIRET invalide (14 chiffres)' });

  if (password.length < 8)
    return res.status(400).json({ error: 'Mot de passe trop court (8 caractères min)' });

  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR siret = ?',
      [email, siret]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email ou SIRET déjà utilisé' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.query(
      'INSERT INTO users (raison_sociale, siret, email, password_hash) VALUES (?, ?, ?, ?)',
      [raison_sociale, siret, email, password_hash]
    );

    const payload = { id: result.insertId, email, raison_sociale };
    setAuthCookie(res, payload);

    res.status(201).json({ user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Identifiants incorrects' });

    const payload = { id: user.id, email: user.email, raison_sociale: user.raison_sociale };
    setAuthCookie(res, payload);

    res.json({ user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnecté' });
});

// GET /api/auth/profile — données complètes du profil connecté
router.get('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, raison_sociale, siret, email, region, prenom, nom, date_naissance, telephone, ville, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const [stats] = await db.query(
      'SELECT COUNT(*) AS nb_annonces FROM produits WHERE seller_id = ?',
      [req.user.id]
    );
    res.json({ ...rows[0], nb_annonces: stats[0].nb_annonces });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/auth/profile — modifier les infos personnelles
router.patch('/profile', require('../middleware/auth'), async (req, res) => {
  const { prenom, nom, date_naissance, telephone, ville, bio, region } = req.body;
  try {
    await db.query(
      'UPDATE users SET prenom = ?, nom = ?, date_naissance = ?, telephone = ?, ville = ?, bio = ?, region = ? WHERE id = ?',
      [prenom || null, nom || null, date_naissance || null, telephone || null, ville || null, bio || null, region || null, req.user.id]
    );
    res.json({ message: 'Profil mis à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me — vérifie si la session est active
router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const user = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    res.json({ user: { id: user.id, email: user.email, raison_sociale: user.raison_sociale } });
  } catch {
    res.status(401).json({ error: 'Session expirée' });
  }
});

module.exports = router;
