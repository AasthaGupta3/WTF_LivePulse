import s from './OccupancyBar.module.css';
export default function OccupancyBar({current,capacity,showLabel=true}) {
  const pct   = capacity>0?Math.min((current/capacity)*100,100):0;
  const color = pct>=90?'red':pct>=70?'yellow':'green';
  return (
    <div className={s.wrap}>
      <div className={s.track}><div className={`${s.fill} ${s[color]}`} style={{width:`${pct}%`}}/></div>
      {showLabel&&<span className={`${s.label} mono`}>{current}/{capacity}</span>}
    </div>
  );
}
