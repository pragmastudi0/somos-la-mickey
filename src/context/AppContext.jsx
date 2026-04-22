import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { setApiApplicationId } from '@/api/client';

const MISSING_APP_ID_MESSAGE = 'Falta configurar VITE_APPLICATION_ID para ejecutar esta app.';

const AppContext = createContext({
  applicationId: null,
  isConfigured: false,
  configurationError: MISSING_APP_ID_MESSAGE,
});

function resolveApplicationId(providedApplicationId) {
  const fromProp = typeof providedApplicationId === 'string' ? providedApplicationId.trim() : '';
  if (fromProp) return fromProp;

  const fromEnv = typeof import.meta.env.VITE_APPLICATION_ID === 'string'
    ? import.meta.env.VITE_APPLICATION_ID.trim()
    : '';
  if (fromEnv) return fromEnv;

  return null;
}

export const AppProvider = ({ children, applicationId }) => {
  const resolvedApplicationId = resolveApplicationId(applicationId);
  const isConfigured = Boolean(resolvedApplicationId);
  const configurationError = isConfigured ? null : MISSING_APP_ID_MESSAGE;

  useEffect(() => {
    setApiApplicationId(isConfigured ? resolvedApplicationId : null);
  }, [isConfigured, resolvedApplicationId]);

  const value = useMemo(
    () => ({
      applicationId: resolvedApplicationId,
      isConfigured,
      configurationError,
    }),
    [configurationError, isConfigured, resolvedApplicationId],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
