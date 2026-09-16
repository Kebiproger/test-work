import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  updateStock,
  validateApiKey,
} from '../api/products';
import Modal from '../components/Modal';
import PhotoSlot from '../components/PhotoSlot';
import QuantityControl from '../components/QuantityControl';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { formatPrice, getProductImage } from '../utils';

const KEY_STORAGE = 'flora_admin_api_key';

export default function Admin() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || '');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [authed, setAuthed] = useState(Boolean(sessionStorage.getItem(KEY_STORAGE)));
  const [gateError, setGateError] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    product_type: 'FLOWER',
    is_active: true,
  });
  const [file, setFile] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadProducts();
  }, [authed, loadProducts]);

  const enter = async (event) => {
    event.preventDefault();
    setGateError('');
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setGateError('Введите API-ключ');
      return;
    }
    try {
      await validateApiKey(trimmed);
      sessionStorage.setItem(KEY_STORAGE, trimmed);
      setApiKey(trimmed);
      setAuthed(true);
    } catch (err) {
      setGateError(err.message || 'Ключ неверный');
    }
  };

  const logout = () => {
    sessionStorage.removeItem(KEY_STORAGE);
    setApiKey('');
    setAuthed(false);
    setKeyInput('');
    setProducts([]);
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (statusFilter === 'ACTIVE') list = list.filter((p) => p.is_active);
    if (statusFilter === 'HIDDEN') list = list.filter((p) => !p.is_active);
    if (statusFilter === 'OOS') list = list.filter((p) => p.stock_quantity <= 0);
    if (typeFilter !== 'ALL') list = list.filter((p) => p.product_type === typeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || String(p.id).includes(q)
      );
    }
    return list;
  }, [products, statusFilter, typeFilter, query]);

  const hiddenCount = products.filter((p) => !p.is_active).length;

  const openCreate = () => {
    setSelected(null);
    setFile(null);
    setFormError('');
    setForm({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      product_type: 'FLOWER',
      is_active: true,
    });
    setMode('form');
  };

  const openEdit = (product) => {
    setSelected(product);
    setFile(null);
    setFormError('');
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      product_type: product.product_type,
      is_active: product.is_active,
    });
    setMode('form');
  };

  const openDelete = (product) => {
    setSelected(product);
    setFormError('');
    setMode('delete');
  };

  const closeModal = () => {
    setMode(null);
    setSelected(null);
    setFormError('');
  };

  const onFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveForm = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      if (!selected) {
        if (!file) {
          setFormError('Выберите изображение');
          setSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description || '');
        formData.append('price', String(form.price));
        formData.append('stock_quantity', String(form.stock_quantity));
        formData.append('product_type', form.product_type);
        formData.append('is_active', String(form.is_active));
        formData.append('file', file);
        await createProduct(formData, apiKey);
      } else {
        await updateProduct(
          selected.id,
          {
            name: form.name,
            description: form.description || null,
            price: Number(form.price),
            stock_quantity: Number(form.stock_quantity),
            product_type: form.product_type,
            is_active: Boolean(form.is_active),
          },
          apiKey
        );
      }
      closeModal();
      await loadProducts();
    } catch (err) {
      setFormError(err.message || 'Не удалось сохранить');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      await deleteProduct(selected.id, apiKey);
      closeModal();
      await loadProducts();
    } catch (err) {
      setFormError(err.message || 'Не удалось удалить');
    } finally {
      setSubmitting(false);
    }
  };

  const onStock = async (product, stock) => {
    try {
      await updateStock(product.id, stock, apiKey);
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, stock_quantity: stock } : item))
      );
    } catch (err) {
      setError(err.message || 'Не удалось обновить остаток');
    }
  };

  if (!authed) {
    return (
      <div className="admin-gate">
        <div className="admin-gate__glow" />
        <div style={{ position: 'relative', width: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 18 }}>
              <span className="brand-dot" />
              Флора
            </span>
            <h3 style={{ margin: 0 }}>Панель управления</h3>
            <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
              Ключ хранится только в этой сессии браузера и уходит в заголовке каждого запроса.
            </p>
          </div>
          <form className="card elev-md" style={{ padding: 'var(--space-6)', gap: 'var(--space-4)' }} onSubmit={enter}>
            <div className="field">
              <label htmlFor="a-key">API-ключ</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input mono"
                  id="a-key"
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  style={{ paddingRight: 38 }}
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  className="btn btn-icon"
                  aria-label="Показать ключ"
                  style={{ position: 'absolute', right: 0, top: 0, height: 36, width: 36, color: 'var(--color-neutral-500)' }}
                  onClick={() => setShowKey((v) => !v)}
                >
                  <i className={`ph ${showKey ? 'ph-eye-slash' : 'ph-eye'}`} style={{ fontSize: 15 }} />
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Войти
            </button>
          </form>
          {gateError && (
            <div className="alert-box">
              <i className="ph ph-warning-circle" style={{ fontSize: 16, color: 'var(--color-accent-300)', marginTop: 2 }} />
              <span>{gateError}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 18, padding: 'var(--space-2)' }}>
          <span className="brand-dot" />
          Флора
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <button type="button" className="nav-link is-active">
            <i className="ph ph-flower-tulip" style={{ fontSize: 16 }} />
            Товары
          </button>
          <button type="button" className="nav-link" disabled style={{ opacity: 0.45 }}>
            <i className="ph ph-receipt" style={{ fontSize: 16 }} />
            Заказы
          </button>
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
          <span className="text-muted" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Ключ активен
          </span>
          <span className="mono" style={{ fontSize: 12 }}>
            ••••{apiKey.slice(-4)}
          </span>
          <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 13 }} onClick={logout}>
            Выйти
          </button>
        </div>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginRight: 'auto' }}>
            <h3 style={{ margin: 0 }}>Товары</h3>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {products.length} позиций · {hiddenCount} скрыто с витрины
            </span>
          </div>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <i className="ph ph-plus" style={{ fontSize: 15 }} />
            Новый товар
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div className="search-wrap">
            <i className="ph ph-magnifying-glass" />
            <input
              className="input"
              type="search"
              placeholder="Название или id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="seg" style={{ margin: 0 }}>
            {[
              ['ALL', 'Все'],
              ['ACTIVE', 'Активные'],
              ['HIDDEN', 'Скрытые'],
              ['OOS', 'Нет в наличии'],
            ].map(([key, label]) => (
              <span className="seg-opt" key={key}>
                <input
                  type="radio"
                  name="a-filter"
                  checked={statusFilter === key}
                  onChange={() => setStatusFilter(key)}
                />
                {label}
              </span>
            ))}
          </label>
          <select
            className="input"
            style={{ width: 150, marginLeft: 'auto' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Все типы</option>
            <option value="FLOWER">FLOWER</option>
            <option value="BOUQUET">BOUQUET</option>
          </select>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={loadProducts} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState title="Нет товаров" message="Создайте первый товар." />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 52 }} />
                  <th>Название</th>
                  <th style={{ width: 104 }}>Тип</th>
                  <th style={{ width: 104, textAlign: 'right' }}>Цена</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Остаток</th>
                  <th style={{ width: 116 }}>Статус</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} style={!product.is_active ? { opacity: 0.6 } : undefined}>
                    <td>
                      <PhotoSlot src={getProductImage(product)} alt="" width={40} height={40} style={{ borderRadius: 'var(--radius-sm)' }}>
                        <i className="ph ph-image" style={{ fontSize: 13 }} />
                      </PhotoSlot>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{product.name}</span>
                        <span className="mono text-muted" style={{ fontSize: 11 }}>
                          FL-{String(product.id).padStart(4, '0')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`tag ${product.product_type === 'BOUQUET' ? 'tag-accent' : 'tag-neutral'}`}>
                        {product.product_type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatPrice(product.price)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <QuantityControl
                        size="sm"
                        value={product.stock_quantity}
                        min={0}
                        max={9999}
                        onChange={(value) => onStock(product, value)}
                      />
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: product.is_active ? 'var(--color-accent)' : 'var(--color-neutral-600)',
                          }}
                        />
                        {product.is_active ? 'Активен' : 'Скрыт'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-icon" aria-label="Изменить" onClick={() => openEdit(product)}>
                          <i className="ph ph-pencil-simple" style={{ fontSize: 15 }} />
                        </button>
                        <button type="button" className="btn btn-icon" aria-label="Удалить" onClick={() => openDelete(product)}>
                          <i className="ph ph-trash" style={{ fontSize: 15 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mode === 'form' && (
        <Modal title={selected ? 'Редактировать товар' : 'Новый товар'} onClose={closeModal}>
          <form onSubmit={saveForm} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="field">
              <label htmlFor="p-name">Название</label>
              <input className="input" id="p-name" name="name" value={form.name} onChange={onFormChange} required />
            </div>
            <div className="field">
              <label htmlFor="p-desc">Описание</label>
              <textarea className="input" id="p-desc" name="description" value={form.description} onChange={onFormChange} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="field">
                <label htmlFor="p-price">Цена, ₽</label>
                <input className="input" id="p-price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={onFormChange} required />
              </div>
              <div className="field">
                <label htmlFor="p-stock">Остаток, шт.</label>
                <input className="input" id="p-stock" name="stock_quantity" type="number" min="0" step="1" value={form.stock_quantity} onChange={onFormChange} required />
              </div>
            </div>
            <label className="seg" style={{ margin: 0 }}>
              <span className="seg-opt">
                <input type="radio" name="product_type" checked={form.product_type === 'FLOWER'} onChange={() => setForm((p) => ({ ...p, product_type: 'FLOWER' }))} />
                FLOWER
              </span>
              <span className="seg-opt">
                <input type="radio" name="product_type" checked={form.product_type === 'BOUQUET'} onChange={() => setForm((p) => ({ ...p, product_type: 'BOUQUET' }))} />
                BOUQUET
              </span>
            </label>
            {!selected && (
              <div className="field">
                <label htmlFor="p-file">Фотография</label>
                <input id="p-file" className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
              </div>
            )}
            <label className="radio">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={onFormChange} />
              <span className="dot" />
              Активен на витрине
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {mode === 'delete' && selected && (
        <Modal title="Удалить товар?" onClose={closeModal}>
          <p>
            Удалить «{selected.name}» безвозвратно?
          </p>
          {formError && <p className="form-error">{formError}</p>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
              Отмена
            </button>
            <button type="button" className="btn btn-primary" onClick={confirmDelete} disabled={submitting}>
              Удалить
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
