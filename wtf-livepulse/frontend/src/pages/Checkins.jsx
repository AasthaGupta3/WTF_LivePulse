import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { fmtTime, fmtRelative } from '../lib/format.js';
import PageHeader   from '../components/PageHeader.jsx';
import Spinner      from '../components/Spinner.jsx';
import OccupancyBar from '../components/OccupancyBar.jsx';
import { useWsStore } from '../store/wsStore.js';
import s from './Checkins.module.css';

export default function Checkins() {
  const [occupancy, setOccupancy] = useState([]);
  const [live,      setLive]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const lastEvent = useWsStore(st=>st.lastEvent);

  async function load() {
    const [occ, lv] = await Promise.all([api.get('/checkins/occupancy'), api.get('/checkins/live')]);
    setOccupancy(occ); setLive(lv); setLoading(false);
  }

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{
    if (lastEvent?.type==='CHECKIN'||lastEvent?.type==='CHECKOUT') load();
  },[lastEvent]);

  if (loading) return <Spinner center />;

  return (
    <div className="fade-in">
      <PageHeader title="Live Check-ins" subtitle={`${live.length} members currently in gym`} />
      <div className={s.layout}>
        <div>
          <h3 className={s.sectionTitle}>Occupancy by Gym</h3>
          <div className={s.occList}>
            {occupancy.map(gym=>(
              <div key={gym.id} className="card">
                <div className={s.occHeader}>
                  <span className={s.occName}>{gym.name}</span>
                  <span className={`mono ${Number(gym.occupancy_pct)>=90?'text-red':Number(gym.occupancy_pct)>=70?'text-yellow':'text-green'}`}>
                    {gym.occupancy_pct}%
                  </span>
                </div>
                <OccupancyBar current={Number(gym.current_occupancy)} capacity={Number(gym.capacity)} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className={s.sectionTitle}>Currently Inside</h3>
          <div className={`card ${s.liveTableWrap}`}>
            <table className={s.table}>
              <thead><tr><th>Member</th><th>Gym</th><th>Checked In</th></tr></thead>
              <tbody>
                {live.slice(0,100).map(ci=>(
                  <tr key={ci.id}>
                    <td className={s.memberName}>{ci.member_name}</td>
                    <td className="text-secondary">{ci.gym_name}</td>
                    <td className="mono text-secondary">{fmtTime(ci.checked_in)} · {fmtRelative(ci.checked_in)}</td>
                  </tr>
                ))}
                {live.length===0&&<tr><td colSpan={3} className="text-muted" style={{textAlign:'center',padding:'24px'}}>No active check-ins</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
