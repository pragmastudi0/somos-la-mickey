export function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

export function allowMethods(req, res, methods) {
  if (!methods.includes(req.method)) {
    sendError(res, 405, 'Method not allowed');
    return false;
  }
  return true;
}
