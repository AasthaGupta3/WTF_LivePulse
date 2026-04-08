import s from './PageHeader.module.css';
export default function PageHeader({title,subtitle,actions}) {
  return (
    <div className={s.header}>
      <div>
        <h1 className={s.title}>{title}</h1>
        {subtitle&&<p className={s.subtitle}>{subtitle}</p>}
      </div>
      {actions&&<div className={s.actions}>{actions}</div>}
    </div>
  );
}
