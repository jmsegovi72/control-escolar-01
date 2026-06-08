export const ENV = {
  API_URL:
    import.meta.env.PUBLIC_API_URL ??
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000/sices/v3',
  API_HEALTH_URL:
    import.meta.env.PUBLIC_API_HEALTH_URL ??
    import.meta.env.VITE_API_HEALTH_URL,
} as const;
