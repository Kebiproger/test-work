export default function Delivery() {
  return (
    <div className="page-pad" style={{ maxWidth: 720 }}>
      <h6 style={{ color: 'var(--color-accent-300)' }}>Доставка</h6>
      <h1>Как мы привозим цветы</h1>
      <p className="text-muted">
        Ближайший слот — сегодня с 16:00. Самовывоз: Покровка, 12. Бесплатная доставка по городу от 3 000 ₽.
      </p>
      <div className="card elev-sm" style={{ padding: 'var(--space-6)', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">10:00 — 13:00</span>
          <span>утро</span>
        </div>
        <div style={{ height: 1, background: 'var(--color-divider)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">16:00 — 19:00</span>
          <span>день</span>
        </div>
        <div style={{ height: 1, background: 'var(--color-divider)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">19:00 — 22:00</span>
          <span>вечер</span>
        </div>
      </div>
    </div>
  );
}
