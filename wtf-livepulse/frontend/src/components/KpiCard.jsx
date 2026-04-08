import s from './KpiCard.module.css';
export default function KpiCard({label,value,sub,color='default',icon,trend}) {
  return (
    <div className={`${s.card} ${s[color]}`}>
      <div className={s.header}>
        <span className={s.label}>{label}</span>
        {icon&&<span className={s.icon}>{icon}</span>}
      </div>
      <div className={`${s.value} mono`}>{value}</div>
      {(sub||trend!==undefined)&&(
        <div className={s.footer}>
          {sub&&<span className={s.sub}>{sub}</span>}
          {trend!==undefined&&<span className={`${s.trend} ${trend>=0?s.up:s.down}`}>{trend>=0?'↑':'↓'} {Math.abs(trend).toFixed(1)}%</span>}
        </div>
      )}
    </div>
  );
}
