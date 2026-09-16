import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../api/products';
import QuantityControl from '../components/QuantityControl';
import PhotoSlot from '../components/PhotoSlot';
import { LoadingState, ErrorState } from '../components/States';
import { useCart } from '../context/CartContext';
import { formatPrice, typeLabel, getProductImage } from '../utils';

export default function ProductDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProduct(id);
      if (!data.is_active) {
        setError('Товар не найден');
        setProduct(null);
      } else {
        setProduct(data);
        setQty(1);
      }
    } catch (err) {
      setError(err.status === 404 ? 'Товар не найден' : err.message);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <LoadingState message="Загружаем карточку…" />;
  if (error || !product) {
    return (
      <ErrorState title="Товар не найден" message={error} onRetry={load} />
    );
  }

  const out = product.stock_quantity <= 0;

  const handleAdd = () => {
    if (out) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-6) var(--space-8) 0', fontSize: 12 }} className="text-muted">
        <Link to="/">Каталог</Link>
        <i className="ph ph-caret-right" style={{ fontSize: 11 }} />
        <Link to={`/catalog?type=${product.product_type}`}>{typeLabel(product.product_type)}</Link>
        <i className="ph ph-caret-right" style={{ fontSize: 11 }} />
        <span>{product.name}</span>
      </div>

      <div className="product-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <PhotoSlot src={getProductImage(product)} alt={product.name} height={480} style={{ borderRadius: 'var(--radius-md)' }}>
            <i className="ph ph-image" style={{ fontSize: 28 }} />
            главное фото · 4:5
          </PhotoSlot>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className={`tag ${product.product_type === 'BOUQUET' ? 'tag-accent' : 'tag-neutral'}`}>
              {typeLabel(product.product_type)}
            </span>
            <span className="tag tag-neutral">id {product.id}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h2 style={{ margin: 0 }}>{product.name}</h2>
            <p className="text-muted" style={{ margin: 0 }}>
              {product.description || 'Собираем в день доставки.'}
            </p>
          </div>

          <hr className="hr" style={{ margin: 0 }} />

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)' }}>
            <span style={{ fontSize: 32, fontFamily: 'var(--font-heading)', fontWeight: 500, letterSpacing: '-0.015em' }}>
              {formatPrice(product.price)}
            </span>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {out ? 'нет в наличии' : `осталось ${product.stock_quantity} шт.`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {!out && (
              <QuantityControl value={qty} onChange={setQty} min={1} max={product.stock_quantity} />
            )}
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={out} onClick={handleAdd}>
              <i className="ph ph-shopping-bag" style={{ fontSize: 16 }} />
              {out ? 'Нет в наличии' : added ? 'Добавлено' : 'Добавить в корзину'}
            </button>
          </div>
          {!out && (
            <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
              Больше {product.stock_quantity} шт. добавить нельзя — ограничение по остатку на складе.
            </p>
          )}

          <hr className="hr" style={{ margin: 0 }} />

          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '140px minmax(0,1fr)', rowGap: 'var(--space-3)', columnGap: 'var(--space-4)', fontSize: 14 }}>
            <dt className="text-muted">Тип</dt>
            <dd style={{ margin: 0 }}>{product.product_type}</dd>
            <dt className="text-muted">Остаток</dt>
            <dd style={{ margin: 0 }}>{product.stock_quantity}</dd>
            <dt className="text-muted">Доставка</dt>
            <dd style={{ margin: 0 }}>Сегодня с 16:00, бесплатно от 3 000 ₽</dd>
            <dt className="text-muted">Артикул</dt>
            <dd style={{ margin: 0 }} className="mono">
              FL-{String(product.id).padStart(4, '0')}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
