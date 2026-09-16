import { Link } from 'react-router-dom';
import QuantityControl from '../components/QuantityControl';
import PhotoSlot from '../components/PhotoSlot';
import { EmptyState } from '../components/States';
import { useCart } from '../context/CartContext';
import { formatPrice, typeLabel, getProductImage } from '../utils';

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, totalCount, lineCount } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Корзина пуста"
        message="Добавьте цветы или букеты из каталога."
        actionLabel="В каталог"
        actionTo="/"
      />
    );
  }

  return (
    <div className="page-pad">
      <div className="cart-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <h2 style={{ margin: 0 }}>Корзина</h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item) => (
              <div key={item.id} className="cart-row">
                <Link to={`/product/${item.id}`}>
                  <PhotoSlot src={getProductImage(item)} alt={item.name} height={88}>
                    <i className="ph ph-image" style={{ fontSize: 16 }} />
                  </PhotoSlot>
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span style={{ fontSize: 16 }}>{item.name}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {typeLabel(item.product_type)} · {formatPrice(item.price)} за шт.
                  </span>
                </div>
                <QuantityControl
                  size="sm"
                  value={item.quantity}
                  min={1}
                  max={item.stock_quantity || 99}
                  onChange={(value) => updateQuantity(item.id, value)}
                />
                <span className="cart-line-total" style={{ fontSize: 16, textAlign: 'right' }}>
                  {formatPrice(Number(item.price) * item.quantity)}
                </span>
                <button
                  type="button"
                  className="btn btn-icon cart-remove"
                  aria-label="Удалить"
                  style={{ color: 'var(--color-neutral-500)' }}
                  onClick={() => removeItem(item.id)}
                >
                  <i className="ph ph-x" style={{ fontSize: 15 }} />
                </button>
              </div>
            ))}
          </div>

          <Link to="/" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
            <i className="ph ph-arrow-left" style={{ fontSize: 15 }} />
            Вернуться в каталог
          </Link>
        </div>

        <aside className="card elev-sm" style={{ padding: 'var(--space-6)', gap: 'var(--space-4)', alignSelf: 'start' }}>
          <h4 style={{ margin: 0 }}>Итого</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">
                {lineCount} позиции, {totalCount} шт.
              </span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Доставка по городу</span>
              <span>{subtotal >= 3000 ? '0 ₽' : 'TBD'}</span>
            </div>
            <div style={{ height: 1, background: 'var(--color-divider)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>К оплате</span>
              <span style={{ fontSize: 25, fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>
          <Link to="/checkout" className="btn btn-primary btn-block">
            Оформить заказ
          </Link>
          <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
            Наличие подтверждается при оформлении. Эндпоинта заказа в API пока нет — форма собирает данные под будущий POST.
          </p>
        </aside>
      </div>
    </div>
  );
}
