<script lang="ts" setup>
import type { LoginCredentials, AuthFormMode } from '@/types/auth/Auth';
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

const auth = useAuth();
const router = useRouter();

const loginToken = ref('');
const mfaMethod = ref('');
const pending = ref(false);
const showInvalid = ref(false);
const step = ref<AuthFormMode>('login');

async function handleLogin(credentials: LoginCredentials) {
  pending.value = true;
  showInvalid.value = false;

  const rememberMe = credentials.rememberMe || false;
  if (!credentials.username || !credentials.password) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  const authResponse = await auth.signIn('credentials', {
    username: credentials.username,
    password: credentials.password,
    rememberMe,
    redirect: false,
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
    const authData = auth.data.value;

    if (authData?.mfaActive && authData?.loginToken) {
      loginToken.value = authData.loginToken;
      mfaMethod.value = authData.mfaMethod || '';
      step.value = 'verify';
      pending.value = false;
      return;
    } else if (authData?.isAuthorized) {
      const route = useRoute();
      const redirect = route.query.redirect as string;
      await router.push(redirect || '/');
      await nextTick();
      const firstName = authData?.user?.firstName || '';

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

  const verifyResult = await auth.signIn('credentials', {
    mfaCode,
    loginToken: loginToken.value,
    redirect: false,
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
  const authData = auth.data.value;
  const firstName = authData?.user?.firstName || '';

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
