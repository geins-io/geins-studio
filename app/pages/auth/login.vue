<script lang="ts" setup>
import type { LoginCredentials, AuthFormMode } from '#shared/types';
import { safeRedirect } from '#shared/utils/login-redirect';
import { useToast } from '@/components/ui/toast/use-toast';

definePageMeta({
  layout: 'auth',
});

const { toast } = useToast();
const { t } = useI18n();
const { login, verify, setAccount, syncSession, session, isAuthenticated } =
  useGeinsAuth();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const router = useRouter();
const route = useRoute();

// State
const mfaMethod = ref('');
const loading = ref(false);
const showInvalid = ref(false);
const rateLimited = ref(false);
const mode = ref<AuthFormMode>('login');

// Initialize auth state
onMounted(async () => {
  await handleInitialState();
});

// Handle authentication state and determine appropriate mode
const handleInitialState = async () => {
  if (session.value?.mfaActive) {
    mfaMethod.value = session.value.mfaMethod || '';
    mode.value = 'verify';
    return;
  }

  if (session.value?.isAuthenticated && !session.value?.accountKey) {
    await userStore.init();
    mode.value = 'account';
    return;
  }

  if (isAuthenticated.value) {
    await redirectToHome();
  }
};

// Redirect to home and show welcome message
const redirectToHome = async () => {
  if (!isAuthenticated.value) {
    showInvalid.value = true;
    loading.value = false;
    return;
  }

  await userStore.init();
  await router.push(safeRedirect(route.query.redirect));

  await nextTick();
  const firstName = user.value?.firstName || '';

  toast({
    title: t('feedback_welcome_back', { name: firstName }),
    description: t('feedback_welcome_back_description'),
    variant: 'positive',
  });
};

// Handle post-authentication flow
const handlePostAuth = async () => {
  if (session.value?.mfaActive) {
    mfaMethod.value = session.value.mfaMethod || '';
    mode.value = 'verify';
    loading.value = false;
    return;
  }

  if (!session.value?.accountKey) {
    await userStore.init();
    mode.value = 'account';
    loading.value = false;
    return;
  }

  if (isAuthenticated.value) {
    await redirectToHome();
    return;
  }

  // If we get here, authentication failed
  loading.value = false;
  showInvalid.value = true;
};

// Event handlers
const handleLogin = async (credentials: LoginCredentials) => {
  if (!credentials.username || !credentials.password) {
    showInvalid.value = true;
    return;
  }

  loading.value = true;
  showInvalid.value = false;
  rateLimited.value = false;

  try {
    const { ok, status } = await login({
      username: credentials.username,
      password: credentials.password,
    });

    if (!ok) {
      showInvalid.value = true;
      rateLimited.value = status === 429;
      return;
    }

    await handlePostAuth();
  } finally {
    loading.value = false;
  }
};

const handleVerify = async (mfaCode: string) => {
  if (!mfaCode) {
    showInvalid.value = true;
    return;
  }

  loading.value = true;
  showInvalid.value = false;
  rateLimited.value = false;

  const { ok, status } = await verify(mfaCode);

  if (!ok) {
    loading.value = false;
    // The login token lives 5 minutes; once it's gone, start over.
    await syncSession().catch(() => undefined);
    if (!session.value?.mfaActive) {
      mode.value = 'login';
      return;
    }
    showInvalid.value = true;
    rateLimited.value = status === 429;
    return;
  }

  await handlePostAuth();
};

const handleSetAccount = async (accountKey: string) => {
  if (!accountKey) {
    showInvalid.value = true;
    return;
  }

  loading.value = true;
  showInvalid.value = false;

  const { ok } = await setAccount(accountKey);

  if (!ok) {
    showInvalid.value = true;
    loading.value = false;
    return;
  }

  await redirectToHome();
};

const handleSetMode = (formMode: AuthFormMode) => {
  mode.value = formMode;
  showInvalid.value = false;
  rateLimited.value = false;
  loading.value = false;
};
</script>

<template>
  <AuthForm
    :mode="mode"
    :loading="loading"
    :show-invalid="showInvalid"
    :rate-limited="rateLimited"
    :mfa-method="mfaMethod"
    :accounts="user?.basicAccounts"
    @login="handleLogin"
    @verify="handleVerify"
    @set-account="handleSetAccount"
    @set-mode="handleSetMode"
  />
</template>
