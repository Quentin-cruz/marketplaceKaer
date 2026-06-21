const router      = require('express').Router();
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const upload      = require('../upload');

// GET /api/produits — liste avec filtres
router.get('/', async (req, res) => {
  const { categorie, etat, region, q, sort } = req.query;

  let sql    = 'SELECT p.*, u.raison_sociale FROM produits p JOIN users u ON p.seller_id = u.id WHERE 1=1';
  const params = [];

  if (categorie) { sql += ' AND p.categorie = ?';         params.push(categorie); }
  if (etat)      { sql += ' AND p.etat = ?';              params.push(etat); }
  if (region)    { sql += ' AND p.region = ?';            params.push(region); }
  if (q)         { sql += ' AND p.titre LIKE ?';          params.push('%' + q + '%'); }

  const orderMap = {
    'prix_asc':  'p.prix_ht ASC',
    'prix_desc': 'p.prix_ht DESC',
    'recent':    'p.created_at DESC',
  };
  sql += ' ORDER BY ' + (orderMap[sort] || 'p.created_at DESC');

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/produits/moi — annonces de l'utilisateur connecté
router.get('/moi', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM produits WHERE seller_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/produits/:id — détail d'un produit
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, u.raison_sociale, u.region AS seller_region FROM produits p JOIN users u ON p.seller_id = u.id WHERE p.id = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/produits — créer une annonce avec photos optionnelles
router.post('/', requireAuth, upload.array('images', 5), async (req, res) => {
  const { titre, description, categorie, prix_ht, etat, region } = req.body;

  if (!titre || !categorie || !etat)
    return res.status(400).json({ error: 'Titre, catégorie et état sont requis' });

  const images = req.files && req.files.length
    ? JSON.stringify(req.files.map(f => f.filename))
    : null;

  try {
    const [result] = await db.query(
      'INSERT INTO produits (seller_id, titre, description, categorie, prix_ht, etat, region, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, titre, description || null, categorie, prix_ht || null, etat, region || null, images]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/produits/:id/images — ajouter des photos à une annonce existante
router.post('/:id/images', requireAuth, upload.array('images', 5), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT seller_id, images FROM produits WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    if (rows[0].seller_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    const existing  = rows[0].images ? JSON.parse(rows[0].images) : [];
    const nouvelles = req.files.map(f => f.filename);
    const toutes    = [...existing, ...nouvelles].slice(0, 5);

    await db.query('UPDATE produits SET images = ? WHERE id = ?', [JSON.stringify(toutes), req.params.id]);
    res.json({ images: toutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/produits/:id — supprimer sa propre annonce
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT seller_id FROM produits WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    if (rows[0].seller_id !== req.user.id)
      return res.status(403).json({ error: 'Non autorisé' });

    await db.query('DELETE FROM produits WHERE id = ?', [req.params.id]);
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
