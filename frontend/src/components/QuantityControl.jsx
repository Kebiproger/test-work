export default function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = 'md',
}) {
  return (
    <div className={`qty ${size === 'sm' ? 'qty--sm' : ''}`} role="group" aria-label="Количество">
      <button
        type="button"
        className="btn"
        disabled={disabled || value <= min}
        aria-label="Уменьшить"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <i className="ph ph-minus" style={{ fontSize: size === 'sm' ? 13 : 15 }} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        className="btn"
        disabled={disabled || value >= max}
        aria-label="Увеличить"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <i className="ph ph-plus" style={{ fontSize: size === 'sm' ? 13 : 15 }} />
      </button>
    </div>
  );
}
