import type { AuthTokens, LoginCredentials, Session } from '#shared/types';
import { jwtDecode } from 'jwt-decode';

export function useGeinsAuth() {
  const auth = useAuth();
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
    const session: Session = {
      ...auth.data.value,
      accountKey,
    };
    return await auth.signIn('credentials', {
      redirect: false,
      ...session,
    });
  };

  const setSession = async (session: Session) => {
    return await auth.signIn('credentials', {
      redirect: false,
      ...session,
    });
  };

  const sessionsAreEqual = (session1: Session, session2: Session) => {
    const copy1 = { ...session1 };
    const copy2 = { ...session2 };
    delete copy1.expires;
    delete copy1.accounts;
    delete copy2.expires;
    delete copy2.accounts;
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

  const expiresSoon = (token?: string | null, threshold = 3540000) => {
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
}
