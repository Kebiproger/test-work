```jsx
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Header({ compact = false }) {
  const { totalCount } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <nav className="nav site-nav">
        {/* Логотип */}
        <Link to="/" className="nav-brand" onClick={() => setOpen(false)}>
          Флора
        </Link>

        {!compact && (
          <div className="nav-links">
            <NavLink to="/" end>
              Каталог
            </NavLink>

            <NavLink to="/catalog?type=BOUQUET">
              Букеты
            </NavLink>

            <NavLink to="/catalog?type=FLOWER">
              Цветы
            </NavLink>

            <NavLink to="/delivery">
              Доставка
            </NavLink>
          </div>
        )}

        {compact && (
          <span className="text-muted checkout-step">
            Шаг 2 из 2 · Оформление
          </span>
        )}

        <span className="nav-spacer" />

        {!compact && (
          <div className="nav-search">
            <i className="ph ph-magnifying-glass" />
            <input
              type="search"
              placeholder="Поиск"
              aria-label="Поиск"
            />
          </div>
        )}

        {/* Корзина */}
        <Link to="/cart" className="btn btn-primary cart-button">
          <i className="ph ph-shopping-bag" />
          Корзина · {totalCount}
        </Link>

        {/* Мобильное меню */}
        {!compact && (
          <button
            type="button"
            className="btn btn-icon btn-secondary menu-toggle"
            aria-label="Меню"
            onClick={() => setOpen((value) => !value)}
          >
            <i
              className={`ph ${open ? 'ph-x' : 'ph-list'}`}
              style={{ fontSize: 18 }}
            />
          </button>
        )}
      </nav>

      {open && !compact && (
        <div className="mobile-menu">
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Каталог
          </NavLink>

          <NavLink
            to="/catalog?type=BOUQUET"
            onClick={() => setOpen(false)}
          >
            Букеты
          </NavLink>

          <NavLink
            to="/catalog?type=FLOWER"
            onClick={() => setOpen(false)}
          >
            Цветы
          </NavLink>

          <NavLink to="/delivery" onClick={() => setOpen(false)}>
            Доставка
          </NavLink>

          <NavLink to="/admin" onClick={() => setOpen(false)}>
            Админка
          </NavLink>
        </div>
      )}
    </>
  );
}
```
