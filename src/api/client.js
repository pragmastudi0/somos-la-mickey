import { supabase } from '@/lib/supabaseClient';

let activeApplicationId = null;

export function setApiApplicationId(applicationId) {
  activeApplicationId = typeof applicationId === 'string' && applicationId.trim()
    ? applicationId.trim()
    : null;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request(path, options = {}) {
  const { accessToken, applicationId, ...fetchOptions } = options;
  const token = accessToken ?? (await getAccessToken());
  const scopedApplicationId = applicationId ?? activeApplicationId;
  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (scopedApplicationId) {
    headers['x-application-id'] = scopedApplicationId;
  }

  const response = await fetch(path, {
    ...fetchOptions,
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
    list: async (sort, limit, applicationId) =>
      request(`/api/${resource}${buildQuery(sort, limit)}`, { applicationId }),
    create: async (payload, applicationId) =>
      request(`/api/${resource}`, { method: 'POST', body: JSON.stringify(payload), applicationId }),
    update: async (id, payload, applicationId) =>
      request(`/api/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(payload), applicationId }),
    delete: async (id, applicationId) =>
      request(`/api/${resource}/${id}`, { method: 'DELETE', applicationId }),
  };
}

export const api = {
  auth: {
    /** Pass accessToken from signIn/signUp response when session is not yet in getSession(). */
    syncCliente: async (accessToken, applicationId) =>
      request('/api/auth/sync-cliente', {
        method: 'POST',
        applicationId,
        ...(accessToken ? { accessToken } : {}),
      }),
  },
  entities: {
    Cliente: createEntityClient('clientes'),
    Compra: createEntityClient('compras'),
    Ciclo: createEntityClient('ciclos'),
    Configuracion: createEntityClient('configuracion'),
    Promocion: createEntityClient('promociones'),
  },
};
