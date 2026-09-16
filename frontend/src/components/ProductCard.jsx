import { Link } from 'react-router-dom';
import { formatPrice, typeLabel, getProductImage } from '../utils';
import PhotoSlot from './PhotoSlot';

export default function ProductCard({ product, onAdd }) {
  const out = product.stock_quantity <= 0;

  return (
    <article className={`card elev-sm ${out ? 'is-oos' : ''}`} style={out ? { opacity: 0.55 } : undefined}>
      <Link to={`/product/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
        <PhotoSlot src={getProductImage(product)} alt={product.name} height={200} className="card-photo">
          <i className="ph ph-image" style={{ fontSize: 22 }} />
          фото 4:5
        </PhotoSlot>
        <span className="card-kicker" style={out ? { color: 'var(--color-neutral-500)' } : undefined}>
          {typeLabel(product.product_type)}
        </span>
        <span className="card-title">{product.name}</span>
        <p className="card-body">{product.description || 'Срез со склада'}</p>
      </Link>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 18 }}>{formatPrice(product.price)}</span>
        <span className="card-meta" style={product.stock_quantity <= 2 && !out ? { color: 'var(--color-accent-300)' } : undefined}>
          {out ? 'нет в наличии' : `осталось ${product.stock_quantity}`}
        </span>
      </div>
      {out ? (
        <button type="button" className="btn btn-secondary btn-block" disabled>
          Нет в наличии
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-block" onClick={() => onAdd?.(product)}>
          В корзину
        </button>
      )}
    </article>
  );
}
