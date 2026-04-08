const router = require('express').Router();
const pool   = require('../db/pool');
const { broadcast } = require('../websocket/wsServer');

router.get('/live', async (req, res, next) => {
  const { gym_id } = req.query;
  const conditions=['ci.checked_out IS NULL'], values=[];
  if (gym_id) { conditions.push(`ci.gym_id=$1`); values.push(gym_id); }
  try {
    const { rows } = await pool.query(
      `SELECT ci.*,m.name AS member_name,g.name AS gym_name,g.capacity FROM checkins ci JOIN members m ON m.id=ci.member_id JOIN gyms g ON g.id=ci.gym_id WHERE ${conditions.join(' AND ')} ORDER BY ci.checked_in DESC`,values);
    res.json(rows);
  } catch(err){next(err);}
});

router.get('/occupancy', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.id,g.name,g.city,g.capacity,COUNT(ci.id) AS current_occupancy,
             ROUND(COUNT(ci.id)::NUMERIC/g.capacity*100,1) AS occupancy_pct
      FROM gyms g LEFT JOIN checkins ci ON ci.gym_id=g.id AND ci.checked_out IS NULL
      GROUP BY g.id ORDER BY occupancy_pct DESC`);
    res.json(rows);
  } catch(err){next(err);}
});

router.get('/hourly', async (req, res, next) => {
  const { gym_id, days=7 } = req.query;
  const conditions=[`checked_in>=NOW()-INTERVAL '${Number(days)} days'`], values=[];
  if (gym_id) { conditions.push(`gym_id=$1`); values.push(gym_id); }
  try {
    const { rows } = await pool.query(
      `SELECT EXTRACT(HOUR FROM checked_in)::INTEGER AS hour,COUNT(*) AS count FROM checkins WHERE ${conditions.join(' AND ')} GROUP BY hour ORDER BY hour`,values);
    res.json(rows);
  } catch(err){next(err);}
});

router.post('/', async (req, res, next) => {
  const { member_id, gym_id } = req.body;
  try {
    const { rows: existing } = await pool.query(`SELECT id FROM checkins WHERE member_id=$1 AND checked_out IS NULL`,[member_id]);
    if (existing.length) return res.status(409).json({error:'Member already checked in'});
    const { rows } = await pool.query(`INSERT INTO checkins (member_id,gym_id) VALUES ($1,$2) RETURNING *`,[member_id,gym_id]);
    await pool.query(`UPDATE members SET last_checkin_at=NOW() WHERE id=$1`,[member_id]);
    broadcast({ type:'CHECKIN', payload:rows[0] });
    res.status(201).json(rows[0]);
  } catch(err){next(err);}
});

router.patch('/:id/checkout', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`UPDATE checkins SET checked_out=NOW() WHERE id=$1 AND checked_out IS NULL RETURNING *`,[req.params.id]);
    if (!rows.length) return res.status(404).json({error:'Active check-in not found'});
    broadcast({ type:'CHECKOUT', payload:rows[0] });
    res.json(rows[0]);
  } catch(err){next(err);}
});

module.exports = router;
