import { supabase } from '@/lib/supabaseClient';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request(path, options = {}) {
  const token = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error || payload.message || message;
    } catch {
      // noop
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function buildQuery(sort, limit) {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  if (limit != null) params.set('limit', String(limit));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function createEntityClient(resource) {
  return {
    list: async (sort, limit) => request(`/api/${resource}${buildQuery(sort, limit)}`),
    create: async (payload) => request(`/api/${resource}`, { method: 'POST', body: JSON.stringify(payload) }),
    update: async (id, payload) => request(`/api/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    delete: async (id) => request(`/api/${resource}/${id}`, { method: 'DELETE' }),
  };
}

export const api = {
  auth: {
    syncCliente: async () => request('/api/auth/sync-cliente', { method: 'POST' }),
  },
  entities: {
    Cliente: createEntityClient('clientes'),
    Compra: createEntityClient('compras'),
    Ciclo: createEntityClient('ciclos'),
    Configuracion: createEntityClient('configuracion'),
    Promocion: createEntityClient('promociones'),
  },
};
