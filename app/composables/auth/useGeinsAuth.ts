import { jwtDecode, type JwtPayload } from 'jwt-decode';
import type {
  AuthSessionError,
  AuthTokens,
  LoginCredentials,
  Session,
  SignInResponse,
} from '#shared/types';
import { createSingleFlight } from '#shared/utils/single-flight';

const REFRESH_LOCK_NAME = 'geins-auth-refresh';

// Module-level, so every useGeinsAuth() caller shares it: one session refresh
// in flight per tab, and one at a time across tabs.
let sharedRefresh: (() => Promise<Session>) | undefined;

interface UseGeinsAuthReturnType {
  session: Ref<Session | null | undefined>;
  accessToken: ComputedRef<string | undefined>;
  isAuthenticated: ComputedRef<boolean>;
  sessionError: ComputedRef<AuthSessionError | undefined>;
  authStateDiffers: ComputedRef<boolean>;
  accountKey: ComputedRef<string | undefined>;
  preLogin: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<SignInResponse>;
  verify: (tokens: AuthTokens) => Promise<SignInResponse>;
  setAccount: (accountKey: string) => Promise<SignInResponse>;
  setSession: (session: Session) => Promise<SignInResponse>;
  sessionsAreEqual: (session1: Session, session2: Session) => boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<Session>;
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
 * @property {function} preLogin - Performs pre-login API pings
 * @property {function} login - Authenticates user with credentials
 * @property {function} verify - Verifies authentication tokens
 * @property {function} setAccount - Sets the active account
 * @property {function} setSession - Updates the session data
 * @property {function} sessionsAreEqual - Compares two session objects
 * @property {function} logout - Logs out the user
 * @property {function} refresh - Re-reads the session (the server refreshes the token if due); single-flight per tab, locked across tabs
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

  const preLogin = async () => {
    $fetch('/api/ping/auth');
    $fetch('/api/ping/account');
  };

  const login = async (
    credentials: LoginCredentials,
  ): Promise<SignInResponse> => {
    return await auth.signIn('credentials', {
      redirect: false,
      ...credentials,
    });
  };

  const verify = async (tokens: AuthTokens): Promise<SignInResponse> => {
    return await auth.signIn('credentials', {
      redirect: false,
      ...tokens,
    });
  };

  const setAccount = async (accountKey: string): Promise<SignInResponse> => {
    // Exclude user from the session to prevent it from being stored in JWT
    const { user, ...currentSession } = auth.data.value || {};
    const session: Session = {
      ...currentSession,
      accountKey,
    };

    return await auth.signIn('credentials', {
      redirect: false,
      ...session,
    });
  };

  const setSession = async (session: Session): Promise<SignInResponse> => {
    const sessionObjectsStringified = stringifySessionObjects(session);

    return await auth.signIn('credentials', {
      redirect: false,
      ...session,
      ...sessionObjectsStringified,
    });
  };

  const stringifySessionObjects = (session: Session) => {
    return Object.keys(session).reduce<Record<keyof Session, string>>(
      (acc, key) => {
        const k = key as keyof Session;
        if (typeof session[k] === 'object') {
          acc[k] = JSON.stringify(session[k]);
        }
        return acc;
      },
      {} as Record<keyof Session, string>,
    );
  };

  const sessionsAreEqual = (session1: Session, session2: Session) => {
    const copy1 = { ...session1 };
    const copy2 = { ...session2 };
    delete copy1.expires;
    delete copy2.expires;
    return JSON.stringify(copy1) === JSON.stringify(copy2);
  };

  const logout = async () => {
    await auth.signOut({ callbackUrl: '/auth/logout' });
  };

  // After taking the lock, `getSession` reads the shared cookie: if another tab
  // already rotated the token, the server sees it isn't due and won't refresh
  // again with the old refresh token.
  sharedRefresh ??= createSingleFlight(
    async () => (await auth.getSession()) as Session,
    { lockName: REFRESH_LOCK_NAME, locks: navigator.locks },
  );
  const refresh = sharedRefresh;

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
    preLogin,
    login,
    verify,
    setAccount,
    setSession,
    sessionsAreEqual,
    logout,
    refresh,
    parseToken,
    isExpired,
    expiresSoon,
  };
};
