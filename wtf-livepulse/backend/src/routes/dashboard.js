const router = require('express').Router();
const pool   = require('../db/pool');

router.get('/overview', async (req, res, next) => {
  const { gym_id } = req.query;
  const gf  = gym_id ? `AND gym_id='${gym_id}'` : '';
  const gfm = gym_id ? `AND m.gym_id='${gym_id}'` : '';
  try {
    const [live, todayCi, todayRev, active, churn, anomalies] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM checkins WHERE checked_out IS NULL ${gf}`),
      pool.query(`SELECT COUNT(*) AS count FROM checkins WHERE checked_in>=CURRENT_DATE ${gf}`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE paid_at>=CURRENT_DATE ${gf}`),
      pool.query(`SELECT COUNT(*) AS count FROM members m WHERE m.status='active' ${gfm}`),
      pool.query(`SELECT COUNT(*) AS count FROM members m WHERE m.status='active' AND (m.last_checkin_at IS NULL OR m.last_checkin_at<NOW()-INTERVAL '14 days') ${gfm}`),
      pool.query(`SELECT COUNT(*) AS count FROM anomalies WHERE resolved=FALSE AND dismissed=FALSE ${gf}`),
    ]);
    res.json({
      live_occupancy:      Number(live.rows[0].count),
      today_checkins:      Number(todayCi.rows[0].count),
      today_revenue:       Number(todayRev.rows[0].total),
      active_members:      Number(active.rows[0].count),
      churn_risk_members:  Number(churn.rows[0].count),
      active_anomalies:    Number(anomalies.rows[0].count),
    });
  } catch(err){next(err);}
});

router.get('/revenue-trend', async (req, res, next) => {
  const { gym_id, days=30 } = req.query;
  const conditions=[`paid_at>=NOW()-INTERVAL '${Number(days)} days'`], values=[];
  if (gym_id) { conditions.push(`gym_id=$1`); values.push(gym_id); }
  try {
    const { rows } = await pool.query(`SELECT DATE_TRUNC('day',paid_at) AS date,SUM(amount) AS revenue,COUNT(*) AS transactions FROM payments WHERE ${conditions.join(' AND ')} GROUP BY 1 ORDER BY 1`,values);
    res.json(rows);
  } catch(err){next(err);}
});

router.get('/checkin-heatmap', async (req, res, next) => {
  const { gym_id } = req.query;
  const conditions=gym_id?[`gym_id=$1`]:[], values=gym_id?[gym_id]:[];
  const where=conditions.length?`WHERE ${conditions.join(' AND ')}`:'';
  try {
    const { rows } = await pool.query(`SELECT day_of_week,hour_of_day,SUM(checkin_count) AS count FROM gym_hourly_stats ${where} GROUP BY day_of_week,hour_of_day ORDER BY day_of_week,hour_of_day`,values);
    res.json(rows);
  } catch(err){next(err);}
});

router.get('/gym-leaderboard', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.id,g.name,g.city,g.capacity,COALESCE(SUM(p.amount),0) AS today_revenue,
             COUNT(DISTINCT p.id) AS today_transactions,COUNT(DISTINCT ci.id) AS live_occupancy
      FROM gyms g
      LEFT JOIN payments p ON p.gym_id=g.id AND p.paid_at>=CURRENT_DATE
      LEFT JOIN checkins ci ON ci.gym_id=g.id AND ci.checked_out IS NULL
      GROUP BY g.id ORDER BY today_revenue DESC`);
    res.json(rows);
  } catch(err){next(err);}
});

module.exports = router;
