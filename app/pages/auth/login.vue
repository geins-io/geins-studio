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

const { login, verify, session } = useGeinsAuth();
const router = useRouter();

const loginToken = ref('');
const mfaMethod = ref('');
const pending = ref(false);
const showInvalid = ref(false);
const step = ref<AuthFormMode>('login');

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

  if (!authResponse) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  if (authResponse.error || !authResponse.ok) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  if (authResponse.ok) {
    if (session.value?.mfaActive && session.value?.loginToken) {
      loginToken.value = session.value.loginToken;
      mfaMethod.value = session.value.mfaMethod || '';
      step.value = 'verify';
      pending.value = false;
      return;
    } else if (session.value?.isAuthenticated) {
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
    }
  }
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

  // Redirect to start page
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
}
</script>

<template>
  <AuthForm
    :mode="step"
    :pending="pending"
    :show-invalid="showInvalid"
    :mfa-method="mfaMethod"
    @login="handleLogin"
    @verify="handleVerify"
  />
</template>
