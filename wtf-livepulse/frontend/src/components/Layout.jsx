import { Outlet, NavLink } from 'react-router-dom';
import { useWsStore } from '../store/wsStore.js';
import s from './Layout.module.css';

const NAV = [
  {to:'/dashboard',label:'Dashboard',icon:'⚡'},
  {to:'/gyms',     label:'Gyms',     icon:'🏋️'},
  {to:'/members',  label:'Members',  icon:'👥'},
  {to:'/checkins', label:'Live',     icon:'📡'},
  {to:'/payments', label:'Revenue',  icon:'💰'},
  {to:'/anomalies',label:'Anomalies',icon:'🚨'},
];

export default function Layout() {
  const status = useWsStore(s=>s.status);
  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.logo}>
          <span className={s.logoMark}>FIT</span>
          <span className={s.logoSub}>CORE</span>
        </div>
        <nav className={s.nav}>
          {NAV.map(({to,label,icon})=>(
            <NavLink key={to} to={to} className={({isActive})=>`${s.navItem}${isActive?' '+s.active:''}`}>
              <span className={s.navIcon}>{icon}</span><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={s.wsStatus}>
          <span className={`${s.wsDot} ${status==='connected'?s.wsConnected:status==='connecting'?s.wsConnecting:s.wsDisconnected}`}/>
          <span className={s.wsLabel}>{status==='connected'?'Live':status==='connecting'?'Connecting…':'Offline'}</span>
        </div>
      </aside>
      <main className={s.main}><Outlet /></main>
    </div>
  );
}
