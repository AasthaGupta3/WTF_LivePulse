import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGymStore } from '../store/gymStore.js';
import { fmtNumber } from '../lib/format.js';
import PageHeader   from '../components/PageHeader.jsx';
import Spinner      from '../components/Spinner.jsx';
import OccupancyBar from '../components/OccupancyBar.jsx';
import Badge        from '../components/Badge.jsx';
import s from './Gyms.module.css';

export default function Gyms() {
  const { gyms, loading, fetchGyms } = useGymStore();
  useEffect(()=>{ fetchGyms(); },[]);
  if (loading) return <Spinner center />;
  return (
    <div className="fade-in">
      <PageHeader title="Gyms" subtitle={`${gyms.length} locations`} />
      <div className={s.grid}>
        {gyms.map(gym=>(
          <Link key={gym.id} to={`/gyms/${gym.id}`} className={`card ${s.gymCard}`}>
            <div className={s.gymTop}>
              <div>
                <div className={s.gymName}>{gym.name}</div>
                <div className={s.gymCity}>{gym.city}</div>
              </div>
              <Badge label={gym.status} color={gym.status==='active'?'green':gym.status==='maintenance'?'yellow':'red'} />
            </div>
            <OccupancyBar current={Number(gym.live_occupancy)} capacity={Number(gym.capacity)} />
            <div className={s.gymStats}>
              <span><b className="mono">{fmtNumber(gym.active_members)}</b> members</span>
              <span><b className="mono">{gym.live_occupancy}</b> live</span>
              <span>{gym.opens_at} – {gym.closes_at}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
