import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { fmtRelative } from '../lib/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner    from '../components/Spinner.jsx';
import Badge      from '../components/Badge.jsx';
import s from './Anomalies.module.css';

const TYPE_LABEL = { zero_checkins:'Zero Check-ins', capacity_breach:'Capacity Breach', revenue_drop:'Revenue Drop' };

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [showAll,   setShowAll]   = useState(false);
  const [loading,   setLoading]   = useState(true);

  async function load() {
    const params = showAll ? '' : '?resolved=false';
    const data = await api.get(`/anomalies${params}`);
    setAnomalies(data); setLoading(false);
  }

  useEffect(()=>{ load(); },[showAll]);

  async function resolve(id) {
    await api.patch(`/anomalies/${id}/resolve`, {});
    load();
  }
  async function dismiss(id) {
    await api.patch(`/anomalies/${id}/dismiss`, {});
    load();
  }

  return (
    <div className="fade-in">
      <PageHeader title="Anomalies" subtitle={`${anomalies.filter(a=>!a.resolved).length} active`}
        actions={
          <button className="btn btn-ghost" onClick={()=>setShowAll(v=>!v)}>
            {showAll?'Show Active':'Show All'}
          </button>
        }
      />
      {loading ? <Spinner center /> : (
        <div className={s.list}>
          {anomalies.length===0&&<div className="card text-muted" style={{textAlign:'center',padding:'48px'}}>✅ No anomalies</div>}
          {anomalies.map(a=>(
            <div key={a.id} className={`card ${s.row} ${a.severity==='critical'?s.critical:s.warning}`}>
              <div className={s.left}>
                <div className={s.topRow}>
                  <Badge label={TYPE_LABEL[a.type]||a.type} color={a.severity==='critical'?'red':'yellow'} />
                  <Badge label={a.severity} color={a.severity==='critical'?'red':'yellow'} />
                  {a.resolved&&<Badge label="resolved" color="green" />}
                </div>
                <div className={s.message}>{a.message}</div>
                <div className={s.meta}>
                  <span className="text-muted">{a.gym_name}</span>
                  <span className="mono text-muted">{fmtRelative(a.detected_at)}</span>
                </div>
              </div>
              {!a.resolved&&(
                <div className={s.actions}>
                  <button className="btn btn-ghost" onClick={()=>resolve(a.id)}>✓ Resolve</button>
                  <button className="btn btn-ghost" onClick={()=>dismiss(a.id)}>Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
