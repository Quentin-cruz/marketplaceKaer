const router      = require('express').Router();
const db          = require('../db');
const requireAuth = require('../middleware/auth');

// GET /api/avis/:vendeurId — liste des avis d'un vendeur
router.get('/:vendeurId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.auteur_id, a.note, a.commentaire, a.created_at,
              u.raison_sociale AS auteur_nom
       FROM avis a
       JOIN users u ON a.auteur_id = u.id
       WHERE a.vendeur_id = ?
       ORDER BY a.created_at DESC`,
      [req.params.vendeurId]
    );
    const [stats] = await db.query(
      'SELECT COUNT(*) AS total, AVG(note) AS moyenne FROM avis WHERE vendeur_id = ?',
      [req.params.vendeurId]
    );
    res.json({ avis: rows, total: stats[0].total, moyenne: stats[0].moyenne });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/avis/:vendeurId — laisser un avis
router.post('/:vendeurId', requireAuth, async (req, res) => {
  const vendeurId = req.params.vendeurId;
  const auteurId  = req.user.id;

  if (parseInt(vendeurId) === auteurId)
    return res.status(400).json({ error: 'Vous ne pouvez pas vous noter vous-même' });

  const { note, commentaire } = req.body;
  if (!note || note < 1 || note > 5)
    return res.status(400).json({ error: 'Note invalide (1 à 5)' });

  try {
    // Vérifier qu'une transaction validée existe entre les deux parties (dans un sens ou l'autre)
    const [[tx]] = await db.query(
      `SELECT id FROM transactions
       WHERE (acheteur_id = ? AND vendeur_id = ?) OR (vendeur_id = ? AND acheteur_id = ?)
       LIMIT 1`,
      [auteurId, vendeurId, auteurId, vendeurId]
    );
    if (!tx) return res.status(403).json({ error: 'Vous devez avoir effectué une transaction avec cette personne pour laisser un avis.' });

    const { transaction_id } = req.body;
    if (!transaction_id) return res.status(400).json({ error: 'transaction_id requis' });

    // Vérifier que la transaction appartient bien à l'auteur et concerne ce vendeur
    const [[txCheck]] = await db.query(
      `SELECT id FROM transactions
       WHERE id = ? AND ((acheteur_id = ? AND vendeur_id = ?) OR (vendeur_id = ? AND acheteur_id = ?))`,
      [transaction_id, auteurId, vendeurId, auteurId, vendeurId]
    );
    if (!txCheck) return res.status(403).json({ error: 'Transaction invalide.' });

    const [[existant]] = await db.query(
      'SELECT id FROM avis WHERE transaction_id = ?',
      [transaction_id]
    );
    if (existant) return res.status(409).json({ error: 'Un avis a déjà été posté pour cette transaction.' });

    await db.query(
      'INSERT INTO avis (vendeur_id, auteur_id, transaction_id, note, commentaire) VALUES (?, ?, ?, ?, ?)',
      [vendeurId, auteurId, transaction_id, note, commentaire || null]
    );
    res.status(201).json({ message: 'Avis enregistré' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
