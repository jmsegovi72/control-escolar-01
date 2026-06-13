import { messages } from '~/config/messages';

type ApiErrorData = {
  message?: string | string[];
  statusCode?: number;
  error?: {
    code?: string;
    details?: string | string[];
    invalidField?: string;
  };
  invalidField?: string;
  field?: string;
  remainingMinutes?: number;
  remainingSeconds?: number;
  remainingTime?: string;
  timeRemaining?: string;
  remaining?: string;
  retryAfterSeconds?: number;
  retryAfter?: number | string;
  lockoutMinutes?: number;
  lockoutSeconds?: number;
  lockoutRemaining?: string;
  lockedUntil?: string;
  unlockAt?: string;
  blockedUntil?: string;
  blockedFor?: string;
  unlockIn?: string;
};

type ApiErrorShape = {
  message?: string;
  response?: {
    status?: number;
    data?: ApiErrorData;
  };
};

export type NormalizedApiError = {
  message: string;
  statusCode: number;
  code?: string;
  invalidField?: string;
  lockout?: {
    remainingText?: string;
  };
};

const STATUS_MESSAGES: Record<number, string> = {
  403: messages.errors.forbidden,
  404: messages.errors.notFound,
  500: messages.errors.internalError,
};

export function normalizeError(
  error: unknown,
  fallback: string,
): NormalizedApiError {
  // 1. Sin respuesta del servidor (error de red/conexión)
  if (!error || typeof error !== 'object' || !('response' in error)) {
    const errorObj = error as { message?: string } | null;
    const isNetworkError =
      errorObj?.message &&
      String(errorObj.message).toLowerCase().includes('network');

    return {
      message: isNetworkError
        ? messages.errors.networkError
        : (errorObj?.message ?? messages.errors.networkError),
      statusCode: 0,
    };
  }

  const apiError = error as ApiErrorShape;
  const data = apiError.response?.data;
  const statusCode = apiError.response?.status ?? 500;
  const rawMessage = data?.message;
  const errorCode = data?.error?.code;
  const invalidField =
    data?.invalidField ?? data?.field ?? data?.error?.invalidField;

  // 2. Array de errores (ValidationPipe de NestJS)
  if (Array.isArray(rawMessage)) {
    return {
      message: rawMessage[0] ?? STATUS_MESSAGES[statusCode] ?? fallback,
      statusCode,
      code: errorCode,
      invalidField,
    };
  }

  // 3. Mensaje único del backend o fallback por código HTTP
  return {
    message:
      rawMessage ?? STATUS_MESSAGES[statusCode] ?? apiError.message ?? fallback,
    statusCode,
    code: errorCode,
    invalidField,
    lockout: {
      remainingText: getLockoutRemainingText(data, rawMessage),
    },
  };
}

function getLockoutRemainingText(
  data?: ApiErrorData,
  message?: string,
): string | undefined {
  if (typeof data?.remainingMinutes === 'number') {
    return formatMinutes(data.remainingMinutes);
  }

  if (typeof data?.lockoutMinutes === 'number') {
    return formatMinutes(data.lockoutMinutes);
  }

  const seconds =
    data?.remainingSeconds ??
    data?.retryAfterSeconds ??
    data?.lockoutSeconds ??
    (typeof data?.retryAfter === 'number' ? data.retryAfter : undefined);

  if (typeof seconds === 'number') {
    return formatSeconds(seconds);
  }

  const unlockAt = data?.unlockAt ?? data?.lockedUntil ?? data?.blockedUntil;

  if (unlockAt) {
    const remaining = new Date(unlockAt).getTime() - Date.now();
    if (remaining > 0) return formatSeconds(Math.ceil(remaining / 1000));
  }

  return parseLockoutText(
    data?.remainingTime ??
      data?.timeRemaining ??
      data?.remaining ??
      data?.lockoutRemaining ??
      data?.blockedFor ??
      data?.unlockIn ??
      (typeof data?.retryAfter === 'string' ? data.retryAfter : undefined) ??
      message,
  );
}

function parseLockoutText(message?: string): string | undefined {
  if (!message) return undefined;

  const normalized = message.toLocaleLowerCase();
  const minutesMatch = normalized.match(/(\d+)\s*(minuto|minutos|min|mins)/);
  if (minutesMatch?.[1]) return formatMinutes(Number(minutesMatch[1]));

  const secondsMatch = normalized.match(/(\d+)\s*(segundo|segundos|seg|segs)/);
  if (secondsMatch?.[1]) return formatSeconds(Number(secondsMatch[1]));

  const clockMatch = normalized.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
  if (clockMatch?.[1] && clockMatch?.[2]) {
    const amPmMatch = normalized.match(
      /\b(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)\b/,
    );

    if (amPmMatch?.[1] && amPmMatch?.[2] && amPmMatch?.[3]) {
      return `despues de las ${amPmMatch[1]}:${amPmMatch[2]} ${normalizeMeridiem(amPmMatch[3])}`;
    }

    const first = Number(clockMatch[1]);
    const second = Number(clockMatch[2]);
    const third = clockMatch[3] ? Number(clockMatch[3]) : undefined;

    if (typeof third === 'number') {
      return formatSeconds(first * 3600 + second * 60 + third);
    }

    return formatSeconds(first * 60 + second);
  }

  return undefined;
}

function normalizeMeridiem(value: string): string {
  const cleanValue = value.replace(/\s+/g, '').replaceAll('.', '');
  return cleanValue.startsWith('p') ? 'p.m.' : 'a.m.';
}

function formatMinutes(minutes: number): string {
  if (minutes <= 1) return '1 minuto';
  return `${Math.ceil(minutes)} minutos`;
}

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(1, Math.ceil(seconds));
  return formatMinutes(Math.ceil(safeSeconds / 60));
}
