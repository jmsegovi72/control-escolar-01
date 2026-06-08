type ApiErrorData = {
  message?: string | string[];
  statusCode?: number;
  error?: {
    code?: string;
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
  status?: number;
  statusCode?: number;
  code?: string;
  invalidField?: string;
  lockout?: {
    remainingText?: string;
  };
};

export function normalizeError(
  error: unknown,
  fallback: string,
): NormalizedApiError {
  const apiError = error as ApiErrorShape;
  const data = apiError.response?.data;
  const message = data?.message;
  const resolvedMessage = Array.isArray(message)
    ? message[0]
    : (message ?? apiError.message ?? fallback);

  return {
    message: resolvedMessage,
    status: apiError.response?.status,
    statusCode: data?.statusCode,
    code: data?.error?.code,
    invalidField: data?.invalidField ?? data?.field,
    lockout: {
      remainingText: getLockoutRemainingText(data, resolvedMessage),
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
