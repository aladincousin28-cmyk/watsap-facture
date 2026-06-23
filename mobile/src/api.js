import Constants from 'expo-constants';

const DEFAULT_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8002';
let BASE_URL = DEFAULT_URL;

export function setBaseUrl(url) { BASE_URL = url; }
export function getBaseUrl() { return BASE_URL; }

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (e) {
    throw new ApiError(
      'Impossible de contacter le serveur. Vérifiez votre connexion et l\'adresse du serveur dans Paramètres.',
      0
    );
  }
  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch (e) {}
    throw new ApiError(
      data?.detail || `Erreur serveur (${res.status})`,
      res.status,
      data
    );
  }
  return res.json();
}

export function getStats() { return request('/api/stats'); }

export function getInvoices(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.recurring) q.set('recurring', 'true');
  const query = q.toString();
  return request(`/api/invoices${query ? '?' + query : ''}`);
}

export function createInvoice(data) {
  return request('/api/invoice/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function markPaid(id) {
  return request(`/api/invoice/${id}/pay`, { method: 'POST' });
}

export function sendReminder(id) {
  return request(`/api/invoice/${id}/remind`, { method: 'POST' });
}

export function getInvoicePdfUrl(id) {
  return `${BASE_URL}/api/invoice/${id}/pdf`;
}

export function getExpenses(params = {}) {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  if (params.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  return request(`/api/expenses${query ? '?' + query : ''}`);
}

export function createExpense(data) {
  return request('/api/expense/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteExpense(id) {
  return request(`/api/expense/${id}`, { method: 'DELETE' });
}

export function getCharts() {
  return request('/api/charts');
}

export function getExpenseStats() {
  return request('/api/expense/stats');
}
