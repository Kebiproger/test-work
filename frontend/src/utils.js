export function formatPrice(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '0 ₽';
  return `${new Intl.NumberFormat('ru-RU').format(amount)} ₽`;
}

export function typeLabel(type) {
  if (type === 'BOUQUET') return 'Букет';
  if (type === 'FLOWER') return 'Цветок';
  return type || '';
}

export function getProductImage(product) {
  return product?.image_url || null;
}
