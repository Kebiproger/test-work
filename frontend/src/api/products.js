/**
 * API helpers — relative URLs через Nginx.
 */

async function parseError(response) {
  let message = `Ошибка запроса (${response.status})`;
  try {
    const data = await response.json();
    if (typeof data.detail === 'string') message = data.detail;
    else if (Array.isArray(data.detail)) {
      message = data.detail.map((item) => item.msg || JSON.stringify(item)).join(', ');
    }
  } catch {
    // keep default
  }
  const error = new Error(message);
  error.status = response.status;
  throw error;
}

export async function getProducts() {
  const response = await fetch('/api/v1/public/products');
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function getProduct(id) {
  const response = await fetch(`/api/v1/public/products/${id}`);
  if (!response.ok) await parseError(response);
  return response.json();
}

/** Проверка ключа: 401/403 = неверный, 404 = ключ принят (товара нет). */
export async function validateApiKey(apiKey) {
  const response = await fetch('/api/v1/admin/products/0', {
    method: 'DELETE',
    headers: { 'X-API-Key': apiKey },
  });
  if (response.status === 401 || response.status === 403) {
    const error = new Error('Ключ неверный — сервер ответил 403. Проверьте ADMIN_API_KEY.');
    error.status = response.status;
    throw error;
  }
  return true;
}

export async function createProduct(formData, apiKey) {
  const response = await fetch('/api/v1/admin/products', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: formData,
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function updateProduct(id, data, apiKey) {
  const response = await fetch(`/api/v1/admin/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function deleteProduct(id, apiKey) {
  const response = await fetch(`/api/v1/admin/products/${id}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': apiKey },
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function updateStock(id, stockQuantity, apiKey) {
  const response = await fetch(`/api/v1/admin/products/${id}/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ stock_quantity: stockQuantity }),
  });
  if (!response.ok) await parseError(response);
  return response.json();
}
