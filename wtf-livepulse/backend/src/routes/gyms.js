const router = require('express').Router();
const pool   = require('../db/pool');

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.*,
        COUNT(DISTINCT m.id) FILTER (WHERE m.status='active') AS active_members,
        COUNT(DISTINCT ci.id) AS live_occupancy
      FROM gyms g
      LEFT JOIN members m ON m.gym_id=g.id
      LEFT JOIN checkins ci ON ci.gym_id=g.id AND ci.checked_out IS NULL
      GROUP BY g.id ORDER BY g.name`);
    res.json(rows);
  } catch(err){next(err);}
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM gyms WHERE id=$1',[req.params.id]);
    if (!rows.length) return res.status(404).json({error:'Gym not found'});
    res.json(rows[0]);
  } catch(err){next(err);}
});

router.post('/', async (req, res, next) => {
  const { name, city, address, capacity, opens_at, closes_at } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO gyms (name,city,address,capacity,opens_at,closes_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name,city,address,capacity,opens_at||'06:00',closes_at||'22:00']);
    res.status(201).json(rows[0]);
  } catch(err){next(err);}
});

router.patch('/:id', async (req, res, next) => {
  const allowed = ['name','city','address','capacity','status','opens_at','closes_at'];
  const fields  = Object.keys(req.body).filter(k=>allowed.includes(k));
  if (!fields.length) return res.status(400).json({error:'No valid fields to update'});
  const sets   = fields.map((f,i)=>`${f}=$${i+2}`).join(', ');
  const values = fields.map(f=>req.body[f]);
  try {
    const { rows } = await pool.query(`UPDATE gyms SET ${sets},updated_at=NOW() WHERE id=$1 RETURNING *`,[req.params.id,...values]);
    if (!rows.length) return res.status(404).json({error:'Gym not found'});
    res.json(rows[0]);
  } catch(err){next(err);}
});

module.exports = router;
