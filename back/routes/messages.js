const router      = require('express').Router();
const db          = require('../db');
const requireAuth = require('../middleware/auth');

// Toutes les routes nécessitent d'être connecté
router.use(requireAuth);

// GET /api/messages/unread — nombre total de messages non lus
router.get('/unread', async (req, res) => {
  try {
    const [[row]] = await db.query(
      'SELECT COUNT(*) AS total FROM messages WHERE to_id = ? AND lu = 0',
      [req.user.id]
    );
    res.json({ total: row.total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages — liste des conversations (un thread par interlocuteur + annonce)
router.get('/', async (req, res) => {
  const moi = req.user.id;
  try {
    const [rows] = await db.query(`
      SELECT
        m.*,
        u.raison_sociale,
        p.titre AS produit_titre,
        p.vendu AS produit_vendu,
        (SELECT COUNT(*) FROM messages m2
          WHERE m2.from_id = conv.autre_id AND m2.to_id = ?
            AND m2.lu = 0
            AND (conv.produit_id IS NULL AND m2.produit_id IS NULL OR m2.produit_id = conv.produit_id)
        ) AS non_lus
      FROM messages m
      JOIN (
        SELECT
          CASE WHEN from_id = ? THEN to_id ELSE from_id END AS autre_id,
          produit_id,
          MAX(id) AS dernier_id
        FROM messages
        WHERE from_id = ? OR to_id = ?
        GROUP BY autre_id, produit_id
      ) conv ON m.id = conv.dernier_id
      JOIN users u ON u.id = conv.autre_id
      LEFT JOIN produits p ON p.id = m.produit_id
      ORDER BY m.created_at DESC
    `, [moi, moi, moi, moi]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages/:userId?produit_id=X — thread complet avec un utilisateur sur une annonce
router.get('/:userId', async (req, res) => {
  const moi      = req.user.id;
  const autre    = parseInt(req.params.userId);
  const produitId = req.query.produit_id ? parseInt(req.query.produit_id) : null;
  try {
    const baseWhere = '((m.from_id = ? AND m.to_id = ?) OR (m.from_id = ? AND m.to_id = ?))';
    const params = [moi, autre, autre, moi];
    const produitClause = produitId ? ' AND m.produit_id = ?' : ' AND m.produit_id IS NULL';
    if (produitId) params.push(produitId);

    const [rows] = await db.query(`
      SELECT m.*, u.raison_sociale AS from_name, p.titre AS produit_titre
      FROM messages m
      JOIN users u ON u.id = m.from_id
      LEFT JOIN produits p ON p.id = m.produit_id
      WHERE ${baseWhere}${produitClause}
      ORDER BY m.created_at ASC
    `, params);

    // Marquer les messages reçus comme lus
    const luParams = [autre, moi];
    const luProduit = produitId ? ' AND produit_id = ?' : ' AND produit_id IS NULL';
    if (produitId) luParams.push(produitId);
    await db.query(
      `UPDATE messages SET lu = 1 WHERE from_id = ? AND to_id = ? AND lu = 0${luProduit}`,
      luParams
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages/produit/:produitId/acheteurs — utilisateurs ayant écrit sur ce produit
router.get('/produit/:produitId/acheteurs', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT u.id, u.raison_sociale
       FROM messages m
       JOIN users u ON u.id = m.from_id
       JOIN produits p ON p.id = m.produit_id
       WHERE m.produit_id = ? AND p.seller_id = ? AND m.from_id != ?`,
      [req.params.produitId, req.user.id, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/messages — envoyer un message
router.post('/', async (req, res) => {
  const { to_id, contenu, produit_id } = req.body;
  const from_id = req.user.id;

  if (!to_id || !contenu?.trim())
    return res.status(400).json({ error: 'Destinataire et contenu requis' });

  if (to_id === from_id)
    return res.status(400).json({ error: 'Vous ne pouvez pas vous envoyer un message' });

  try {
    const [result] = await db.query(
      'INSERT INTO messages (from_id, to_id, produit_id, contenu) VALUES (?, ?, ?, ?)',
      [from_id, to_id, produit_id || null, contenu.trim()]
    );
    const [rows] = await db.query(
      'SELECT m.*, u.raison_sociale AS from_name FROM messages m JOIN users u ON u.id = m.from_id WHERE m.id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
