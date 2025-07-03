<script lang="ts" setup>
import type { LoginCredentials, AuthFormMode } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
});

const { toast } = useToast();
const { t } = useI18n();
const { login, verify, setAccount, preLogin, session, isAuthenticated } =
  useGeinsAuth();
const router = useRouter();

// State
const loginToken = ref('');
const mfaMethod = ref('');
const loading = ref(false);
const showInvalid = ref(false);
const step = ref<AuthFormMode>('login');

// Initialize auth state
onMounted(async () => {
  await preLogin();
  await handleInitialState();
});

// Handle authentication state and determine appropriate step
const handleInitialState = async () => {
  if (session.value?.mfaActive && session.value?.loginToken) {
    loginToken.value = session.value.loginToken;
    mfaMethod.value = session.value.mfaMethod || '';
    step.value = 'verify';
    return;
  }

  if (session.value?.accounts && !session.value?.accountKey) {
    step.value = 'account';
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

  const route = useRoute();
  const redirect = route.query.redirect as string;
  await router.push(redirect || '/');

  await nextTick();
  const firstName = session.value?.user?.firstName || '';

  toast({
    title: t('feedback_welcome_back', { name: firstName }),
    description: t('feedback_welcome_back_description'),
    variant: 'positive',
  });
};

// Handle post-authentication flow
const handlePostAuth = async () => {
  if (session.value?.mfaActive && session.value?.loginToken) {
    loginToken.value = session.value.loginToken;
    mfaMethod.value = session.value.mfaMethod || '';
    step.value = 'verify';
    loading.value = false;
    return;
  }

  if (session.value?.accounts && !session.value?.accountKey) {
    step.value = 'account';
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

  try {
    const authResponse = await login({
      username: credentials.username,
      password: credentials.password,
    });

    if (!authResponse || authResponse.error || !authResponse.ok) {
      showInvalid.value = true;
      return;
    }

    await handlePostAuth();
  } finally {
    loading.value = false;
  }
};

const handleVerify = async (mfaCode: string) => {
  if (!loginToken.value || !mfaCode) {
    showInvalid.value = true;
    return;
  }

  loading.value = true;
  showInvalid.value = false;

  const verifyResult = await verify({
    mfaCode,
    loginToken: loginToken.value,
  });

  if (!verifyResult || verifyResult.error) {
    showInvalid.value = true;
    loading.value = false;
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

  const setAccountResult = await setAccount(accountKey);

  if (!setAccountResult || setAccountResult.error) {
    showInvalid.value = true;
    loading.value = false;
    return;
  }

  await redirectToHome();
};

const handleSetMode = (mode: AuthFormMode) => {
  step.value = mode;
  showInvalid.value = false;
  loading.value = false;
};
</script>

<template>
  <AuthForm
    :mode="step"
    :loading="loading"
    :show-invalid="showInvalid"
    :mfa-method="mfaMethod"
    :accounts="session?.accounts"
    @login="handleLogin"
    @verify="handleVerify"
    @set-account="handleSetAccount"
    @set-mode="handleSetMode"
  />
</template>
