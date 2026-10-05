type ErrorRecord = Record<string, unknown>;

export function errorRecord(value: unknown): ErrorRecord {
  return value && typeof value === 'object' ? (value as ErrorRecord) : {};
}

export function driverErrorRecord(value: unknown): ErrorRecord {
  const error = errorRecord(value);
  return error.driverError ? errorRecord(error.driverError) : error;
}

const UNAVAILABLE_CODES = new Set([
  'ER_LOCK_DEADLOCK',
  'ER_LOCK_WAIT_TIMEOUT',
  'ER_CON_COUNT_ERROR',
  'ER_TOO_MANY_USER_CONNECTIONS',
  'ER_SERVER_SHUTDOWN',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
]);

export function isUnavailableError(value: unknown): boolean {
  const error = driverErrorRecord(value);
  return (
    UNAVAILABLE_CODES.has(String(error.code)) ||
    [1040, 1053, 1203, 1205, 1213].includes(Number(error.errno))
  );
}

export function isDatabaseError(value: unknown): boolean {
  const error = errorRecord(value);
  const driver = driverErrorRecord(value);
  return (
    error.name === 'QueryFailedError' ||
    Boolean(error.driverError) ||
    typeof driver.sqlState === 'string' ||
    typeof driver.errno === 'number' ||
    (typeof driver.code === 'string' && driver.code.startsWith('ER_'))
  );
}

/** Preserve actionable diagnostics without SQL, parameters, bodies or error messages. */
export function errorDiagnostics(value: unknown) {
  const wrapper = errorRecord(value);
  const cause = wrapper.cause ?? value;
  const error = errorRecord(cause);
  const driver = driverErrorRecord(cause);
  const safeLabel = (candidate: unknown, pattern: RegExp) =>
    typeof candidate === 'string' && pattern.test(candidate)
      ? candidate
      : undefined;
  return {
    errorType:
      safeLabel(error.name, /^[A-Za-z][A-Za-z0-9_]{0,63}$/) ?? 'UnknownError',
    driverCode: safeLabel(driver.code, /^[A-Z][A-Z0-9_]{0,63}$/),
    sqlState: safeLabel(driver.sqlState, /^[A-Z0-9]{5}$/),
    errno: Number.isSafeInteger(driver.errno) ? driver.errno : undefined,
    // Keep only source locations, never the exception's first line (which can contain SQL).
    locations:
      typeof error.stack === 'string'
        ? error.stack
            .split('\n')
            .slice(1)
            .map(
              (line) =>
                line.match(
                  /(?:\(|\s)((?:\/|file:\/\/)[^\s()]+:\d+:\d+)\)?$/,
                )?.[1],
            )
            .filter((location): location is string => Boolean(location))
            .slice(0, 8)
        : [],
  };
}
