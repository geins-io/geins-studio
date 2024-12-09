import type { AuthTokens, LoginCredentials, Session } from '@/types/auth/Auth';
import { jwtDecode } from 'jwt-decode';

export function useGeinsAuth() {
  const auth = useAuth();

  const isRefreshing = ref(false);

  const session = computed(() => auth.data.value);
  const isAuthenticated = computed(
    () =>
      auth.status.value === 'authenticated' && session.value?.isAuthenticated,
  );
  const accessToken = computed(() => session.value?.accessToken);
  const authStateDiffers = computed(
    () =>
      auth.status.value === 'authenticated' && !session.value?.isAuthenticated,
  );

  const login = async (credentials: LoginCredentials) => {
    return await auth.signIn('credentials', {
      redirect: false,
      ...credentials,
    });
  };

  const verify = async (credentials: AuthTokens) => {
    return await auth.signIn('credentials', {
      redirect: false,
      ...credentials,
    });
  };

  const logout = async () => {
    await auth.signOut();
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

  const expiresSoon = (token?: string | null, threshold = 150000) => {
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
    login,
    verify,
    logout,
    refresh,
    setIsRefreshing,
    parseToken,
    isExpired,
    expiresSoon,
  };
}
