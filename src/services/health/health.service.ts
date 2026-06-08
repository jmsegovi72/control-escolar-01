import { ENV } from '~/config/env';
import type { SidebarStatusTone } from '~/ui/patterns/Sidebar/sidebar.types';

export type HealthStatus = {
  value: string;
  tone: SidebarStatusTone;
};

export type SystemHealthStatus = {
  backend: HealthStatus;
  database: HealthStatus;
};

type BackendHealthResponse = {
  status?: string;
  services?: {
    api?: string;
    database?: string;
  };
};

const withTimeout = async (url: string, timeout = 3000) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const healthUrl = () => ENV.API_HEALTH_URL ?? `${ENV.API_URL}/health`;

const isUp = (value?: string) => value?.toUpperCase() === 'UP';

const mapBackendStatus = (status?: string): HealthStatus =>
  isUp(status)
    ? { value: 'En linea', tone: 'online' }
    : { value: 'Sin conexion', tone: 'offline' };

const mapDatabaseStatus = (status?: string): HealthStatus =>
  isUp(status)
    ? { value: 'Conectada', tone: 'online' }
    : { value: 'Sin conexion', tone: 'offline' };

export const healthService = {
  async checkSystem(): Promise<SystemHealthStatus> {
    try {
      const response = await withTimeout(healthUrl());
      const data = (await response.json()) as BackendHealthResponse;

      if (!response.ok) {
        return {
          backend: mapBackendStatus(data.services?.api ?? 'UP'),
          database: mapDatabaseStatus(data.services?.database ?? data.status),
        };
      }

      return {
        backend: mapBackendStatus(data.services?.api ?? data.status),
        database: mapDatabaseStatus(data.services?.database ?? data.status),
      };
    } catch {
      return {
        backend: { value: 'Sin conexion', tone: 'offline' },
        database: { value: 'Sin conexion', tone: 'offline' },
      };
    }
  },
};
