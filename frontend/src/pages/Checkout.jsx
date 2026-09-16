import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import PhotoSlot from '../components/PhotoSlot';
import { useCart } from '../context/CartContext';
import { formatPrice, getProductImage } from '../utils';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [ship, setShip] = useState('delivery');
  const [slot, setSlot] = useState('16-19');
  const [pay, setPay] = useState('card');
  const [done, setDone] = useState(false);

  if (items.length === 0 && !done) {
    return <Navigate to="/cart" replace />;
  }

  if (done) {
    return (
      <div className="page-pad" style={{ maxWidth: 560 }}>
        <h2>Заявка собрана</h2>
        <p className="text-muted">
          Данные формы сохранены локально. Отправки на сервер нет — в API пока нет POST /orders.
        </p>
        <Link to="/" className="btn btn-primary">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const submit = (event) => {
    event.preventDefault();
    clearCart();
    setDone(true);
  };

  return (
    <div>
      <Header compact />
      <div className="page-pad">
        <form className="checkout-layout" onSubmit={submit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', maxWidth: 620 }}>
            <h2 style={{ margin: 0 }}>Оформление заказа</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h5 style={{ margin: 0 }}>Получатель</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 'var(--space-4)' }}>
                <div className="field">
                  <label htmlFor="c-name">Имя и фамилия</label>
                  <input className="input" id="c-name" required />
                </div>
                <div className="field">
                  <label htmlFor="c-phone">Телефон</label>
                  <input className="input" id="c-phone" required />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="c-mail">Email для чека</label>
                  <input className="input" id="c-mail" type="email" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h5 style={{ margin: 0 }}>Способ получения</h5>
              <label className="seg" style={{ margin: 0 }}>
                <span className="seg-opt">
                  <input type="radio" name="ship" checked={ship === 'delivery'} onChange={() => setShip('delivery')} />
                  <i className="ph ph-scooter" style={{ fontSize: 15 }} />
                  Доставка курьером
                </span>
                <span className="seg-opt">
                  <input type="radio" name="ship" checked={ship === 'pickup'} onChange={() => setShip('pickup')} />
                  <i className="ph ph-storefront" style={{ fontSize: 15 }} />
                  Самовывоз, Покровка 12
                </span>
              </label>
              {ship === 'delivery' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="field">
                    <label htmlFor="c-addr">Адрес</label>
                    <input className="input" id="c-addr" required />
                  </div>
                  <div className="field">
                    <label htmlFor="c-date">Дата</label>
                    <input className="input" id="c-date" required />
                  </div>
                </div>
              )}
              <label className="seg" style={{ margin: 0 }}>
                <span className="seg-opt">
                  <input type="radio" name="slot" checked={slot === '10-13'} onChange={() => setSlot('10-13')} />
                  10:00 — 13:00
                </span>
                <span className="seg-opt">
                  <input type="radio" name="slot" checked={slot === '16-19'} onChange={() => setSlot('16-19')} />
                  16:00 — 19:00
                </span>
                <span className="seg-opt">
                  <input type="radio" name="slot" checked={slot === '19-22'} onChange={() => setSlot('19-22')} />
                  19:00 — 22:00
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h5 style={{ margin: 0 }}>Открытка и пожелания</h5>
              <div className="field">
                <label htmlFor="c-note">Текст открытки — до 200 символов</label>
                <textarea className="input" id="c-note" maxLength={200} />
              </div>
              <label className="radio">
                <input type="checkbox" />
                <span className="dot" />
                Не звонить получателю — сюрприз
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h5 style={{ margin: 0 }}>Оплата</h5>
              <label className="radio">
                <input type="radio" name="pay" checked={pay === 'card'} onChange={() => setPay('card')} />
                <span className="dot" />
                Картой онлайн
              </label>
              <label className="radio">
                <input type="radio" name="pay" checked={pay === 'sbp'} onChange={() => setPay('sbp')} />
                <span className="dot" />
                СБП по QR-коду
              </label>
              <label className="radio">
                <input type="radio" name="pay" checked={pay === 'cash'} onChange={() => setPay('cash')} />
                <span className="dot" />
                Курьеру при получении
              </label>
            </div>
          </div>

          <aside className="card elev-sm" style={{ padding: 'var(--space-6)', gap: 'var(--space-4)', alignSelf: 'start' }}>
            <h4 style={{ margin: 0 }}>Ваш заказ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <PhotoSlot src={getProductImage(item)} alt="" className="" height={44} style={{ width: 44, flex: 'none' }}>
                    <i className="ph ph-image" style={{ fontSize: 14 }} />
                  </PhotoSlot>
                  <span style={{ fontSize: 13, flex: 1 }}>
                    {item.name} × {item.quantity}
                  </span>
                  <span style={{ fontSize: 13 }}>{formatPrice(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--color-divider)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>К оплате</span>
              <span style={{ fontSize: 25, fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
                {formatPrice(subtotal)}
              </span>
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Оплатить {formatPrice(subtotal)}
            </button>
            <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
              Нажимая «Оплатить», вы соглашаетесь с условиями доставки. Реальной оплаты и API заказа нет.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
