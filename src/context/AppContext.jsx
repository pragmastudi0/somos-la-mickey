import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { setApiApplicationId } from '@/api/client';

const AppContext = createContext({ applicationId: null });

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
  useEffect(() => {
    setApiApplicationId(resolvedApplicationId);
  }, [resolvedApplicationId]);

  const value = useMemo(
    () => ({ applicationId: resolvedApplicationId }),
    [resolvedApplicationId],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
