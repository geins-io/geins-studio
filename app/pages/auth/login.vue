<script lang="ts" setup>
import type { LoginCredentials, AuthFormMode } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

const { toast } = useToast();
const { t } = useI18n();

definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
});

const { login, verify, setAccount, preLogin, session, isAuthenticated } =
  useGeinsAuth();
const router = useRouter();

onMounted(async () => {
  await preLogin();
});

const loginToken = ref('');
const mfaMethod = ref('');
const pending = ref(false);
const showInvalid = ref(false);
const step = ref<AuthFormMode>('login');

const redirectAndWelcome = async () => {
  if (!isAuthenticated.value) {
    showInvalid.value = true;
    pending.value = false;
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

async function handleStep() {
  if (session.value?.mfaActive && session.value?.loginToken) {
    loginToken.value = session.value.loginToken;
    mfaMethod.value = session.value.mfaMethod || '';
    step.value = 'verify';
    pending.value = false;
    return;
  }
  if (session.value?.accounts && !session.value?.accountKey) {
    step.value = 'account';
    pending.value = false;
    return;
  }
  if (isAuthenticated.value) {
    await redirectAndWelcome();
  }
}

await handleStep();

async function handleLogin(credentials: LoginCredentials) {
  pending.value = true;
  showInvalid.value = false;

  if (!credentials.username || !credentials.password) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  const authResponse = await login({
    username: credentials.username,
    password: credentials.password,
  });

  if (!authResponse || authResponse.error || !authResponse.ok) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  await handleStep();
}

async function handleVerify(mfaCode: string) {
  pending.value = true;
  showInvalid.value = false;

  if (!loginToken.value) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  const verifyResult = await verify({
    mfaCode,
    loginToken: loginToken.value,
  });

  if (!verifyResult || verifyResult.error) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  await handleStep();
}

async function handleSetAccount(accountKey: string) {
  pending.value = true;
  showInvalid.value = false;

  const setAccountResult = await setAccount(accountKey);

  if (!setAccountResult || setAccountResult.error) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  await redirectAndWelcome();
}
</script>

<template>
  <AuthForm
    :mode="step"
    :pending="pending"
    :show-invalid="showInvalid"
    :mfa-method="mfaMethod"
    :accounts="session?.accounts"
    @login="handleLogin"
    @verify="handleVerify"
    @set-account="handleSetAccount"
  />
</template>
