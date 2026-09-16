import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { useCart } from '../context/CartContext';

export default function Catalog() {
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const filter = typeParam === 'FLOWER' || typeParam === 'BOUQUET' ? typeParam : 'ALL';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('price-asc');
  const [visible, setVisible] = useState(12);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProducts();
      setProducts(data.filter((p) => p.is_active === true));
    } catch (err) {
      setError(err.message || 'Не удалось загрузить каталог');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const flowers = products.filter((p) => p.product_type === 'FLOWER').length;
    const bouquets = products.filter((p) => p.product_type === 'BOUQUET').length;
    return { all: products.length, flowers, bouquets };
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (filter !== 'ALL') list = list.filter((p) => p.product_type === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (sort === 'price-asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    return list;
  }, [products, filter, query, sort]);

  const shown = filtered.slice(0, visible);

  const setFilter = (key) => {
    setVisible(12);
    if (key === 'ALL') setSearchParams({});
    else setSearchParams({ type: key });
  };

  return (
    <div>
      <div className="hero-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 560 }}>
          <h6 style={{ margin: 0, color: 'var(--color-accent-300)' }}>Срез сегодняшнего утра</h6>
          <h1 style={{ margin: 0 }}>Цветы, собранные в день доставки</h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Поштучно и в букетах. Наличие обновляется со склада — если позиции нет, вы её здесь не увидите.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="text-muted">В наличии сегодня</span>
            <span>{counts.all} позиций</span>
          </div>
          <div style={{ height: 1, background: 'var(--color-divider)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="text-muted">Ближайшая доставка</span>
            <span>сегодня, 16:00</span>
          </div>
          <div style={{ height: 1, background: 'var(--color-divider)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="text-muted">Самовывоз</span>
            <span>Покровка, 12</span>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <label className="seg" style={{ margin: 0 }}>
          <span className="seg-opt">
            <input type="radio" name="f-type" checked={filter === 'ALL'} onChange={() => setFilter('ALL')} />
            Все {counts.all}
          </span>
          <span className="seg-opt">
            <input type="radio" name="f-type" checked={filter === 'FLOWER'} onChange={() => setFilter('FLOWER')} />
            Цветы {counts.flowers}
          </span>
          <span className="seg-opt">
            <input type="radio" name="f-type" checked={filter === 'BOUQUET'} onChange={() => setFilter('BOUQUET')} />
            Букеты {counts.bouquets}
          </span>
        </label>

        <div className="search-wrap">
          <i className="ph ph-magnifying-glass" />
          <input
            className="input"
            type="search"
            placeholder="Поиск по названию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <span className="text-muted" style={{ marginLeft: 'auto', fontSize: 13 }}>
          Сортировка
        </span>
        <select className="input" style={{ width: 180 }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="price-asc">Сначала недорогие</option>
          <option value="price-desc">Сначала дорогие</option>
          <option value="name">По названию</option>
        </select>
      </div>

      {loading && <LoadingState message="Загружаем витрину…" />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="Ничего не найдено" message="Попробуйте другой фильтр или поиск." actionLabel="Сбросить" actionTo="/" />
      )}

      {!loading && !error && shown.length > 0 && (
        <>
          <div className="product-grid" style={{ padding: '0 var(--space-8) var(--space-8)' }}>
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={(p) => addItem(p, 1)} />
            ))}
          </div>
          {visible < filtered.length && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', padding: '0 var(--space-8) 40px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setVisible((v) => v + 12)}>
                Показать ещё
              </button>
              <span className="text-muted" style={{ fontSize: 12 }}>
                Показано {shown.length} из {filtered.length}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
