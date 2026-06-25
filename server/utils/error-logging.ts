/**
 * Network-level error diagnostics for the API proxy.
 *
 * On a connection-level failure (DNS, TLS, ECONNRESET, socket/gateway timeout)
 * the request never leaves the proxy, so the caught error has no
 * `statusCode`/`statusMessage`/`data`. The only useful signal lives on the
 * underlying system error — usually on `error.cause` — as `code` / `errno` /
 * `syscall` / `address` / `port`. This extracts those fields so the catch
 * block can log *why* the connection failed. See STU-246.
 */

export interface NetworkErrorInfo {
  code?: string;
  errno?: string | number;
  syscall?: string;
  address?: string;
  port?: number;
  cause?: { name?: string; code?: string; message?: string };
}

type SysErrorShape = {
  code?: string;
  errno?: string | number;
  syscall?: string;
  address?: string;
  port?: number;
  name?: string;
  message?: string;
  cause?: unknown;
};

const asObject = (value: unknown): SysErrorShape | undefined =>
  value && typeof value === 'object' ? (value as SysErrorShape) : undefined;

/**
 * Extract the network cause from a thrown $fetch / FetchError. The system-level
 * fields usually live on `error.cause`; fall back to the top-level error when
 * they don't.
 */
export function describeNetworkError(err: unknown): NetworkErrorInfo {
  const e = asObject(err) ?? {};
  const cause = asObject(e.cause);
  const sys = cause ?? e;

  return {
    code: sys.code ?? e.code,
    errno: sys.errno ?? e.errno,
    syscall: sys.syscall ?? e.syscall,
    address: sys.address ?? e.address,
    port: sys.port ?? e.port,
    cause: cause
      ? { name: cause.name, code: cause.code, message: cause.message }
      : undefined,
  };
}
