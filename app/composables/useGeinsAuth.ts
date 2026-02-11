import { jwtDecode } from 'jwt-decode';
import type { AuthTokens, LoginCredentials, Session } from '#shared/types';

interface UseGeinsAuthReturnType {
  session: Ref<Session | null | undefined>;
  accessToken: ComputedRef<string | undefined>;
  isAuthenticated: ComputedRef<boolean>;
  isRefreshing: Ref<boolean>;
  authStateDiffers: ComputedRef<boolean>;
  accountKey: ComputedRef<string | undefined>;
  preLogin: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<any>;
  verify: (tokens: AuthTokens) => Promise<any>;
  setAccount: (accountKey: string) => Promise<any>;
  setSession: (session: Session) => Promise<any>;
  sessionsAreEqual: (session1: Session, session2: Session) => boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<Session>;
  setIsRefreshing: (value: boolean) => void;
  parseToken: (token?: string | null) => any;
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
 * @property {Ref<boolean>} isRefreshing - Whether token refresh is in progress
 * @property {ComputedRef<boolean>} authStateDiffers - Whether auth state has inconsistencies
 * @property {ComputedRef<string>} accountKey - Current account key
 * @property {function} preLogin - Performs pre-login API pings
 * @property {function} login - Authenticates user with credentials
 * @property {function} verify - Verifies authentication tokens
 * @property {function} setAccount - Sets the active account
 * @property {function} setSession - Updates the session data
 * @property {function} sessionsAreEqual - Compares two session objects
 * @property {function} logout - Logs out the user
 * @property {function} refresh - Refreshes the authentication session
 * @property {function} setIsRefreshing - Sets the refreshing state
 * @property {function} parseToken - Parses JWT token payload
 * @property {function} isExpired - Checks if token is expired
 * @property {function} expiresSoon - Checks if token expires soon
 */
export const useGeinsAuth = (): UseGeinsAuthReturnType => {
  const auth = useAuth();
  // TODO: remove isrefreshing flow and replace with auth state loading
  const isRefreshing = ref(false);

  const session = toRef(auth.data);
  const isAuthenticated = computed<boolean>(() => {
    return (
      auth.status.value === 'authenticated' &&
      !!session.value?.isAuthenticated &&
      !!session.value?.accountKey
    );
  });
  const accessToken = computed(() => session.value?.accessToken);
  const authStateDiffers = computed(
    () =>
      auth.status.value === 'authenticated' && !session.value?.isAuthenticated,
  );

  const accountKey = computed(() => session.value?.accountKey);

  const preLogin = async () => {
    $fetch('/api/ping/auth');
    $fetch('/api/ping/account');
  };

  const login = async (credentials: LoginCredentials) => {
    return await auth.signIn('credentials', {
      redirect: false,
      ...credentials,
    });
  };

  const verify = async (tokens: AuthTokens) => {
    return await auth.signIn('credentials', {
      redirect: false,
      ...tokens,
    });
  };

  const setAccount = async (accountKey: string) => {
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

  const setSession = async (session: Session) => {
    // Exclude user from the session to prevent it from being stored in JWT
    const { user, ...sessionWithoutUser } = session;
    const sessionObjectsStringified =
      stringifySessionObjects(sessionWithoutUser);

    return await auth.signIn('credentials', {
      redirect: false,
      ...sessionWithoutUser,
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

  const refresh = async (): Promise<Session> => {
    return (await auth.refresh()) as Session;
  };

  const setIsRefreshing = (value: boolean) => {
    isRefreshing.value = value;
  };

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
    isRefreshing,
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
    setIsRefreshing,
    parseToken,
    isExpired,
    expiresSoon,
  };
};
