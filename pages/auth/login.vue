<script lang="ts" setup>
import type {
  LoginCredentials,
  LoginResponse,
  Session,
  SignInResult,
  Dfa,
} from '@/types/auth/Auth';

definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
});

const { data, signIn } = useAuth();
const router = useRouter();

const dfa = ref<Dfa>({ username: '', token: '', sentTo: '', active: false });
const pending = ref(false);
const showInvalid = ref(false);
const step = ref<'login' | 'verify'>('login');

async function handleLogin(user: LoginCredentials) {
  pending.value = true;
  showInvalid.value = false;

  const rememberMe = user.rememberMe || false;
  if (!user.username || !user.password) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  // Type for signinResult
  const signinResult = await signIn('credentials', {
    username: user.username,
    password: user.password,
    rememberMe,
    redirect: false,
  });
  if ((signinResult as any).error || (signinResult as any).ok === false) {
    showInvalid.value = true;
    const error = (signinResult as any).error;
    console.log('error: ', error);
    return;
  }
  if ((signinResult as any).ok === true) {
    // check if dfa
    if ((data.value as any) && (data.value as any).dfa?.active === true) {
      const dfaData = (data.value as any).dfa;
      dfa.value.username = dfaData.username;
      dfa.value.sentTo = dfaData.sentTo;
      dfa.value.token = dfaData.token;
      step.value = 'verify';
      pending.value = false;
      return;
    }
  }
}

async function handleVerify(code: string) {
  pending.value = true;
  showInvalid.value = false;

  // Type for verifyResult
  const verifyResult = await signIn('credentials', {
    username: dfa.value.username,
    dfaToken: dfa.value.token,
    dfaCode: code,
    dfa: true,
    redirect: false,
  });

  if ((verifyResult as any).error) {
    showInvalid.value = true;
    pending.value = false;
    return;
  }

  // redirect to start page
  router.push('/');
}
</script>

<template>
  <AuthForm
    :mode="step"
    :pending="pending"
    :show-invalid="showInvalid"
    :sent-to="dfa.sentTo"
    :username="dfa.username"
    @login="handleLogin"
    @verify="handleVerify"
  />
</template>
