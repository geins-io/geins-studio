import {
  useBroadcastChannel,
  type UseBroadcastChannelReturn,
} from '@vueuse/core';
import type {
  AuthBroadcastMessage,
  AuthSessionError,
  ForceRefreshRequest,
  LoginCredentials,
  Session,
  SignInResponse,
} from '#shared/types';
import { CSRF_HEADER } from '#shared/utils/csrf';
import { createSingleFlight } from '#shared/utils/single-flight';

const REFRESH_LOCK_NAME = 'geins-auth-refresh';
const AUTH_CHANNEL_NAME = 'geins-auth';
const SESSION_ENDPOINT = '/api/auth/session';

// Module-level, so every useGeinsAuth() caller shares them: one session read
// in flight per tab, one at a time across tabs, and one channel per tab (a
// tab never receives its own posts).
let sharedRefresh: (() => Promise<Session>) | undefined;
let sharedForceRefresh:
  | ((rejectedTokenExpires: number | undefined) => Promise<Session>)
  | undefined;
let sharedSync: (() => Promise<Session>) | undefined;
let authChannel:
  | UseBroadcastChannelReturn<AuthBroadcastMessage, AuthBroadcastMessage>
  | undefined;

interface UseGeinsAuthReturnType {
  session: Ref<Session | null>;
  isAuthenticated: ComputedRef<boolean>;
  sessionError: ComputedRef<AuthSessionError | undefined>;
  authStateDiffers: ComputedRef<boolean>;
  accountKey: ComputedRef<string | undefined>;
  authSignal: ComputedRef<AuthBroadcastMessage | undefined>;
  broadcastAuthSignal: (message: AuthBroadcastMessage) => void;
  login: (credentials: LoginCredentials) => Promise<SignInResponse>;
  verify: (mfaCode: string) => Promise<SignInResponse>;
  setAccount: (accountKey: string) => Promise<SignInResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<Session>;
  forceRefresh: (rejectedTokenExpires: number | undefined) => Promise<Session>;
  syncSession: () => Promise<Session>;
  isExpired: () => boolean;
  expiresSoon: (threshold?: number) => boolean;
}

const statusOf = (error: unknown): number => {
  const status = (error as { statusCode?: unknown } | null)?.statusCode;
  return typeof status === 'number' ? status : 0;
};

/**
 * Composable for Geins authentication state and operations.
 *
 * The browser never holds a Geins token: they live in the sealed session
 * cookie, and the API proxy attaches them. This composable reads the session
 * the server lets the browser see (`GET /api/auth/session`) and posts to the
 * auth routes.
 *
 * @returns {UseGeinsAuthReturnType} - An object containing authentication state and operations
 * @property {Ref} session - The client session: no tokens
 * @property {ComputedRef<boolean>} isAuthenticated - Signed in, with an account picked
 * @property {ComputedRef<AuthSessionError>} sessionError - Why the last token refresh failed, if it did
 * @property {ComputedRef<boolean>} authStateDiffers - Geins rejected the refresh token; the session is over unless a re-check finds it rotated
 * @property {ComputedRef<string>} accountKey - Current account key
 * @property {ComputedRef<AuthBroadcastMessage>} authSignal - The last auth signal from another tab
 * @property {function} broadcastAuthSignal - Posts an auth signal to the other tabs
 * @property {function} login - Password step
 * @property {function} verify - MFA step; the login token stays on the server
 * @property {function} setAccount - Picks the account; the server checks the token allows it
 * @property {function} logout - Drops the session and lands on /auth/logout
 * @property {function} refresh - Re-reads the session (the server refreshes the token if due); single-flight per tab, locked across tabs. Signals the other tabs when the token changed
 * @property {function} forceRefresh - Refreshes the token now, even if it hasn't expired, after the API rejected the one with `rejectedTokenExpires`; single-flight per tab, under the same lock as `refresh`. Signals the other tabs when the token changed
 * @property {function} syncSession - Re-reads the session like `refresh`, without signalling (for signal receivers)
 * @property {function} isExpired - Whether the access token has expired
 * @property {function} expiresSoon - Whether the access token expires within `threshold` ms (default 5 min)
 */
export const useGeinsAuth = (): UseGeinsAuthReturnType => {
  const session = useState<Session | null>('geins-session', () => null);

  const isAuthenticated = computed<boolean>(
    () => !!session.value?.isAuthenticated && !!session.value?.accountKey,
  );
  const sessionError = computed(() => session.value?.error);
  const authStateDiffers = computed(
    () => sessionError.value === 'RefreshTokenInvalid',
  );
  const accountKey = computed(() => session.value?.accountKey);

  // Detached scope: the channel must outlive the component that happens to
  // call useGeinsAuth first. The auth-state plugin calls it before any
  // component does, so the channel opens right away rather than on mount.
  authChannel ??= effectScope(true).run(() =>
    useBroadcastChannel<AuthBroadcastMessage, AuthBroadcastMessage>({
      name: AUTH_CHANNEL_NAME,
    }),
  );
  const authSignal = computed(() => authChannel?.data.value);
  // Signals only, never sessions: tabs share the session cookie, so a
  // receiver re-reads its own session.
  const broadcastAuthSignal = (message: AuthBroadcastMessage) => {
    authChannel?.post(message);
  };

  // Throws on failure and keeps the last good session: a failed read is
  // never a logout.
  const fetchSession = async (): Promise<Session> => {
    const next = await $fetch<Session>(SESSION_ENDPOINT, { retry: 0 });
    session.value = next;
    return next;
  };

  const post = <T>(path: string, body?: object) =>
    $fetch<T>(path, {
      method: 'POST',
      body,
      headers: { [CSRF_HEADER]: '1' },
      retry: 0,
    });

  const signalIfRotated = (next: Session, previousExpiry?: number) => {
    if (next.isAuthenticated && next.tokenExpires !== previousExpiry) {
      broadcastAuthSignal({ type: 'session-changed' });
    }
  };

  // Under the lock, the session read sees the shared cookie: if another tab
  // already rotated the token, the server finds it isn't due and won't refresh
  // again with the old refresh token.
  const lockOptions = { lockName: REFRESH_LOCK_NAME, locks: navigator.locks };
  if (!sharedRefresh && !navigator.locks) {
    useGeinsLog('composables/useGeinsAuth.ts').geinsLogWarn(
      'Web Locks unavailable: token refresh is single-flight per tab only',
    );
  }
  sharedRefresh ??= createSingleFlight(async () => {
    const previousExpiry = session.value?.tokenExpires;
    const next = await fetchSession();
    signalIfRotated(next, previousExpiry);
    return next;
  }, lockOptions);
  // The server refreshes only while the cookie still holds the rejected token.
  sharedForceRefresh ??= createSingleFlight(
    async (rejectedTokenExpires: number | undefined) => {
      const body: ForceRefreshRequest = { rejectedTokenExpires };
      const next = await post<Session>('/api/auth/refresh', body);
      session.value = next;
      signalIfRotated(next, rejectedTokenExpires);
      return next;
    },
    lockOptions,
  );
  // Separate flight for signal receivers: re-signalling would echo the change
  // back to every tab.
  sharedSync ??= createSingleFlight(fetchSession, lockOptions);
  const refresh = sharedRefresh;
  const forceRefresh = sharedForceRefresh;
  const syncSession = sharedSync;

  const authStep = async (
    step: () => Promise<unknown>,
  ): Promise<SignInResponse> => {
    try {
      await step();
    } catch (error) {
      return { ok: false, status: statusOf(error) };
    }
    if (isAuthenticated.value) {
      broadcastAuthSignal({ type: 'session-changed' });
    }
    return { ok: true, status: 200 };
  };

  // Login and verify answer with the next step; the session they wrote is
  // read back. The account route answers with the session itself.
  const login = (credentials: LoginCredentials) =>
    authStep(async () => {
      await post('/api/auth/login', {
        username: credentials.username,
        password: credentials.password,
      });
      await fetchSession();
    });

  const verify = (mfaCode: string) =>
    authStep(async () => {
      await post('/api/auth/verify', { mfaCode });
      await fetchSession();
    });

  const setAccount = (key: string) =>
    authStep(async () => {
      session.value = await post<Session>('/api/auth/account', {
        accountKey: key,
      });
    });

  // A full load of /auth/logout drops every store; the auth middleware there
  // signals the other tabs once the cookie is gone.
  const logout = async () => {
    await post('/api/auth/logout');
    session.value = { isAuthenticated: false };
    await navigateTo('/auth/logout', { external: true });
  };

  const isExpired = () => {
    const exp = session.value?.tokenExpires;
    return !!exp && Date.now() > exp * 1000;
  };

  const expiresSoon = (threshold = 300000) => {
    const exp = session.value?.tokenExpires;
    return !!exp && Date.now() + threshold > exp * 1000;
  };

  return {
    session,
    isAuthenticated,
    sessionError,
    authStateDiffers,
    accountKey,
    authSignal,
    broadcastAuthSignal,
    login,
    verify,
    setAccount,
    logout,
    refresh,
    forceRefresh,
    syncSession,
    isExpired,
    expiresSoon,
  };
};
