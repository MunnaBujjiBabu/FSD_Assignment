const API_BASE = 'http://localhost:8080/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getBooks: (query = '') => request(`/books${query ? `?${query}` : ''}`),
  createReservation: (payload) => request('/reservations', { method: 'POST', body: JSON.stringify(payload) }),
  getReservations: () => request('/reservations'),
  updateReservationStatus: (id, status) =>
    request(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
