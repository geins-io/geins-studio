<script lang="ts" setup>
import type { LoginCredentials, AuthFormMode, TFA } from '@/types/auth/Auth';
import { useToast } from '@/components/ui/toast/use-toast';

definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
});

const auth = useAuth();
const router = useRouter();

const tfa = ref<TFA | null>(null);
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

  const signInResult = await auth.signIn('credentials', {
    username: credentials.username,
    password: credentials.password,
    rememberMe,
    redirect: false,
  });

  if (!signInResult) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  if (signInResult.error || !signInResult.ok) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  if (signInResult.ok) {
    const authData = auth.data.value;

    if (authData?.tfa) {
      tfa.value = authData.tfa;
      step.value = 'verify';
      pending.value = false;
      return;
    }
  }
}

const { toast } = useToast();
const { t } = useI18n();

async function handleVerify(code: string) {
  pending.value = true;
  showInvalid.value = false;

  if (!tfa.value) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  const verifyResult = await auth.signIn('credentials', {
    ...tfa.value,
    code,
    redirect: false,
  });

  if (!verifyResult || verifyResult.error) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  // Redirect to start page
  await router.push('/');

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
    :sent-to="tfa?.sentTo"
    :username="tfa?.username"
    @login="handleLogin"
    @verify="handleVerify"
  />
</template>
