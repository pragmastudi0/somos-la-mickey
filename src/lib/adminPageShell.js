/**
 * Shared responsive shell styles for admin pages (inline-style codebase).
 */
export function getAdminPageShellStyle(isMobile) {
  const base = {
    margin: '0 auto',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  };
  if (!isMobile) {
    return {
      ...base,
      padding: '32px 28px',
    };
  }
  return {
    ...base,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 'max(16px, env(safe-area-inset-left))',
    paddingRight: 'max(16px, env(safe-area-inset-right))',
  };
}

export function adminHeadingStyle(isMobile) {
  return {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 900,
    fontSize: isMobile ? 22 : 26,
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.02em',
  };
}

/** Title row: stack CTA below title on mobile */
export function adminHeaderRowStyle(isMobile) {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'flex-end',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 14 : 0,
    marginBottom: 24,
  };
}

export function adminPrimaryCtaStyle(isMobile) {
  return {
    width: isMobile ? '100%' : 'auto',
    justifyContent: 'center',
    minHeight: 44,
    WebkitTapHighlightColor: 'transparent',
  };
}
