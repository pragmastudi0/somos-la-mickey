import { sendError } from './http.js';

export function resolveApplicationId(req) {
  const headerValue = req.headers['x-application-id'];
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim();
  }

  const envValue = process.env.APPLICATION_ID || process.env.VITE_APPLICATION_ID;
  if (typeof envValue === 'string' && envValue.trim()) {
    return envValue.trim();
  }

  return null;
}

export function requireApplicationId(req, res) {
  const applicationId = resolveApplicationId(req);
  if (!applicationId) {
    sendError(res, 400, 'Missing application id');
    return null;
  }
  return applicationId;
}
