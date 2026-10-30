import {
  useBroadcastChannel,
  type UseBroadcastChannelReturn,
} from '@vueuse/core';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import type {
  AuthBroadcastMessage,
  AuthSessionError,
  AuthTokens,
  LoginCredentials,
  Session,
  SignInResponse,
} from '#shared/types';
import { createSingleFlight } from '#shared/utils/single-flight';

const REFRESH_LOCK_NAME = 'geins-auth-refresh';
const AUTH_CHANNEL_NAME = 'geins-auth';

// Module-level, so every useGeinsAuth() caller shares them: one session read
// in flight per tab, one at a time across tabs, and one channel per tab (a
// tab never receives its own posts).
let sharedRefresh: (() => Promise<Session>) | undefined;
let sharedSync: (() => Promise<Session>) | undefined;
let authChannel:
  | UseBroadcastChannelReturn<AuthBroadcastMessage, AuthBroadcastMessage>
  | undefined;

interface UseGeinsAuthReturnType {
  session: Ref<Session | null | undefined>;
  accessToken: ComputedRef<string | undefined>;
  isAuthenticated: ComputedRef<boolean>;
  sessionError: ComputedRef<AuthSessionError | undefined>;
  authStateDiffers: ComputedRef<boolean>;
  accountKey: ComputedRef<string | undefined>;
  authSignal: ComputedRef<AuthBroadcastMessage | undefined>;
  broadcastAuthSignal: (message: AuthBroadcastMessage) => void;
  preLogin: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<SignInResponse>;
  verify: (tokens: AuthTokens) => Promise<SignInResponse>;
  setAccount: (accountKey: string) => Promise<SignInResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<Session>;
  syncSession: () => Promise<Session>;
  parseToken: (token?: string | null) => JwtPayload | null;
  isExpired: (token?: string | null) => boolean;
  expiresSoon: (token?: string | null, threshold?: number) => boolean;
}

/**
 * Composable for Geins authentication state and operations.
 *
 * Provides comprehensive authentication utilities including session management,
 * token handling, login/logout operations, and token validation with expiration checks.
 *
 * @returns {UseGeinsAuthReturnType} - An object containing authentication state and operations
 * @property {Ref} session - Current authentication session data
 * @property {ComputedRef<string>} accessToken - Current access token
 * @property {ComputedRef<boolean>} isAuthenticated - Whether user is authenticated
 * @property {ComputedRef<AuthSessionError>} sessionError - Why the last token refresh failed, if it did
 * @property {ComputedRef<boolean>} authStateDiffers - Whether auth state has inconsistencies
 * @property {ComputedRef<string>} accountKey - Current account key
 * @property {ComputedRef<AuthBroadcastMessage>} authSignal - The last auth signal from another tab
 * @property {function} broadcastAuthSignal - Posts an auth signal to the other tabs
 * @property {function} preLogin - Performs pre-login API pings
 * @property {function} login - Authenticates user with credentials
 * @property {function} verify - Verifies authentication tokens
 * @property {function} setAccount - Sets the active account
 * @property {function} logout - Logs out the user
 * @property {function} refresh - Re-reads the session (the server refreshes the token if due); single-flight per tab, locked across tabs. Signals the other tabs when the token changed
 * @property {function} syncSession - Re-reads the session like `refresh`, without signalling (for signal receivers)
 * @property {function} parseToken - Parses JWT token payload
 * @property {function} isExpired - Checks if token is expired
 * @property {function} expiresSoon - Checks if token expires soon
 */
export const useGeinsAuth = (): UseGeinsAuthReturnType => {
  const auth = useAuth();

  const session = toRef(auth.data);
  const isAuthenticated = computed<boolean>(() => {
    return (
      auth.status.value === 'authenticated' &&
      !!session.value?.isAuthenticated &&
      !!session.value?.accountKey
    );
  });
  const accessToken = computed(() => session.value?.accessToken);
  const sessionError = computed(() => session.value?.error);
  const authStateDiffers = computed(
    () =>
      auth.status.value === 'authenticated' && !session.value?.isAuthenticated,
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
  // Signals only, never tokens or sessions: tabs share the session cookie,
  // so a receiver re-reads its own session.
  const broadcastAuthSignal = (message: AuthBroadcastMessage) => {
    authChannel?.post(message);
  };

  const signIn = async (
    options: LoginCredentials | AuthTokens | Session,
  ): Promise<SignInResponse> => {
    const result = await auth.signIn('credentials', {
      redirect: false,
      ...options,
    });
    if (!result?.error && isAuthenticated.value) {
      broadcastAuthSignal({ type: 'session-changed' });
    }
    return result;
  };

  const preLogin = async () => {
    $fetch('/api/ping/auth');
    $fetch('/api/ping/account');
  };

  const login = (credentials: LoginCredentials): Promise<SignInResponse> =>
    signIn(credentials);

  const verify = (tokens: AuthTokens): Promise<SignInResponse> =>
    signIn(tokens);

  const setAccount = async (accountKey: string): Promise<SignInResponse> => {
    // Exclude user from the session to prevent it from being stored in JWT
    const { user, ...currentSession } = auth.data.value || {};
    return signIn({ ...currentSession, accountKey });
  };

  // Every logout lands on /auth/logout, where the auth middleware signals the
  // other tabs once the cookie is cleared.
  const logout = async () => {
    await auth.signOut({ callbackUrl: '/auth/logout' });
  };

  // After taking the lock, `getSession` reads the shared cookie: if another tab
  // already rotated the token, the server sees it isn't due and won't refresh
  // again with the old refresh token.
  const lockOptions = { lockName: REFRESH_LOCK_NAME, locks: navigator.locks };
  if (!sharedRefresh && !navigator.locks) {
    useGeinsLog('composables/useGeinsAuth.ts').geinsLogWarn(
      'Web Locks unavailable: token refresh is single-flight per tab only',
    );
  }
  sharedRefresh ??= createSingleFlight(async () => {
    const previousToken = accessToken.value;
    const next = (await auth.getSession()) as Session;
    if (next?.isAuthenticated && next.accessToken !== previousToken) {
      broadcastAuthSignal({ type: 'session-changed' });
    }
    return next;
  }, lockOptions);
  // Separate flight for signal receivers: re-signalling would echo the change
  // back to every tab.
  sharedSync ??= createSingleFlight(
    async () => (await auth.getSession()) as Session,
    lockOptions,
  );
  const refresh = sharedRefresh;
  const syncSession = sharedSync;

  const parseToken = (token?: string | null) => {
    token = token || accessToken.value;
    return token ? jwtDecode(token) : null;
  };

  const isExpired = (token?: string | null) => {
    token = token || accessToken.value;
    let exp = parseToken(token)?.exp;
    if (!exp) {
      return false;
    }
    exp = exp * 1000;
    return Date.now() > exp;
  };

  const expiresSoon = (token?: string | null, threshold = 300000) => {
    token = token || accessToken.value;
    let exp = parseToken(token)?.exp;
    if (!exp) {
      return false;
    }
    exp = exp * 1000;
    return Date.now() + threshold > exp;
  };

  return {
    session,
    accessToken,
    isAuthenticated,
    sessionError,
    authStateDiffers,
    accountKey,
    authSignal,
    broadcastAuthSignal,
    preLogin,
    login,
    verify,
    setAccount,
    logout,
    refresh,
    syncSession,
    parseToken,
    isExpired,
    expiresSoon,
  };
};
