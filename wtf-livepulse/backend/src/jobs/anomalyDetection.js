const cron = require('node-cron');
const pool = require('../db/pool');
const { broadcast } = require('../websocket/wsServer');

const SCHEDULE               = process.env.ANOMALY_CRON_SCHEDULE        || '*/5 * * * *';
const ZERO_CHECKINS_MIN      = Number(process.env.ZERO_CHECKINS_THRESHOLD_MIN)    || 60;
const CAPACITY_BREACH_PCT    = Number(process.env.CAPACITY_BREACH_THRESHOLD_PCT)  || 90;
const REVENUE_DROP_PCT       = Number(process.env.REVENUE_DROP_THRESHOLD_PCT)     || 30;

async function insertAnomaly(client, gymId, type, severity, message) {
  const { rows } = await client.query(
    `SELECT id FROM anomalies WHERE gym_id=$1 AND type=$2 AND resolved=FALSE AND detected_at>NOW()-INTERVAL '2 hours' LIMIT 1`,
    [gymId, type],
  );
  if (rows.length) return null;
  const { rows: ins } = await client.query(
    `INSERT INTO anomalies (gym_id,type,severity,message) VALUES ($1,$2,$3,$4) RETURNING *`,
    [gymId, type, severity, message],
  );
  return ins[0];
}

async function detectAnomalies() {
  const client = await pool.connect();
  try {
    const { rows: gyms } = await client.query(
      `SELECT id,name,opens_at,closes_at FROM gyms WHERE status='active' AND CURRENT_TIME BETWEEN opens_at AND closes_at`
    );
    for (const gym of gyms) {
      const { rows } = await client.query(`SELECT MAX(checked_in) AS last_ci FROM checkins WHERE gym_id=$1 AND checked_in>=CURRENT_DATE`,[gym.id]);
      const minutesSince = rows[0].last_ci ? (Date.now()-new Date(rows[0].last_ci).getTime())/60000 : Infinity;
      if (minutesSince > ZERO_CHECKINS_MIN) {
        const a = await insertAnomaly(client, gym.id, 'zero_checkins', 'warning', `No check-ins at ${gym.name} for ${Math.round(minutesSince)} minutes`);
        if (a) broadcast({ type:'ANOMALY', payload:a });
      }
    }

    const { rows: occ } = await client.query(
      `SELECT g.id,g.name,g.capacity,COUNT(ci.id) AS live FROM gyms g LEFT JOIN checkins ci ON ci.gym_id=g.id AND ci.checked_out IS NULL GROUP BY g.id HAVING COUNT(ci.id)::FLOAT/g.capacity*100>=$1`,
      [CAPACITY_BREACH_PCT]
    );
    for (const gym of occ) {
      const pct = Math.round((gym.live/gym.capacity)*100);
      const a = await insertAnomaly(client, gym.id, 'capacity_breach', pct>=100?'critical':'warning', `${gym.name} at ${pct}% capacity (${gym.live}/${gym.capacity})`);
      if (a) broadcast({ type:'ANOMALY', payload:a });
    }

    const { rows: rev } = await client.query(`
      WITH today AS (SELECT gym_id,COALESCE(SUM(amount),0) AS rev FROM payments WHERE paid_at>=CURRENT_DATE GROUP BY gym_id),
           lw    AS (SELECT gym_id,COALESCE(SUM(amount),0) AS rev FROM payments WHERE paid_at>=CURRENT_DATE-INTERVAL '7 days' AND paid_at<CURRENT_DATE-INTERVAL '6 days' GROUP BY gym_id)
      SELECT t.gym_id,g.name,t.rev AS today_rev,lw.rev AS week_ago_rev,
             CASE WHEN lw.rev>0 THEN ROUND((1-t.rev/lw.rev)*100,1) ELSE 0 END AS drop_pct
      FROM today t JOIN lw ON lw.gym_id=t.gym_id JOIN gyms g ON g.id=t.gym_id
      WHERE lw.rev>0 AND (1-t.rev/lw.rev)*100>=$1`, [REVENUE_DROP_PCT]
    );
    for (const row of rev) {
      const a = await insertAnomaly(client, row.gym_id, 'revenue_drop', 'warning', `Revenue at ${row.name} down ${row.drop_pct}% vs same day last week`);
      if (a) broadcast({ type:'ANOMALY', payload:a });
    }
  } catch (err) {
    console.error('[anomalyDetection] Error:', err.message);
  } finally {
    client.release();
  }
}

function startAnomalyDetection() {
  console.log(`[jobs] Anomaly detection scheduled: ${SCHEDULE}`);
  cron.schedule(SCHEDULE, detectAnomalies);
  detectAnomalies();
}

module.exports = { startAnomalyDetection, detectAnomalies };
