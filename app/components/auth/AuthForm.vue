<script setup lang="ts">
import type { LoginCredentials, AuthFormMode } from '#shared/types';
import { Input } from '#components';

const emit = defineEmits(['login', 'verify', 'set-account', 'set-mode']);

const props = withDefaults(
  defineProps<{
    pending: boolean;
    showInvalid: boolean;
    mode: AuthFormMode;
    mfaMethod?: string;
    accounts?: AuthAccounts;
  }>(),
  {
    pending: false,
    showInvalid: false,
    mfaMethod: '',
  },
);

// Global
const loginMode = computed(() => props.mode === 'login');
const verifyMode = computed(() => props.mode === 'verify');
const accountMode = computed(() => props.mode === 'account');
const showInvalid = ref(props.showInvalid);

watchEffect(() => {
  showInvalid.value = props.showInvalid;
});

onMounted(() => {
  if (loginMode.value) {
    const el = emailInput.value?.$el;
    if (el instanceof HTMLInputElement) {
      el.focus();
    }
  }
});

// Global feedback
const alertTitle = computed(() => {
  switch (props.mode) {
    case 'login':
      return 'Invalid credentials';
    case 'verify':
      return 'Invalid code';
    default:
      return 'Something went wrong';
  }
});
const alertDescription = computed(() => {
  switch (props.mode) {
    case 'login':
      return 'Please check your email and password and try again.';
    case 'verify':
      return 'Please check the code and try again.';
    default:
      return 'Please refresh this page and try again.';
  }
});

// Login
const email = ref('');
const emailInput = ref<typeof Input | null>(null);
const emailValid = ref(true);
const password = ref('');
const passwordValid = ref(true);
const rememberMe = ref(false);

const validatePassword = () => {
  passwordValid.value = password.value.length > 5;
};
const validateEmail = () => {
  emailValid.value = email.value.includes('@');
};
const allFieldsValid = computed(() => {
  return emailValid.value && passwordValid.value;
});

const login = () => {
  showInvalid.value = false;
  const userCredentials: LoginCredentials = {
    username: email.value,
    password: password.value,
    rememberMe: rememberMe.value,
  };
  validateEmail();
  validatePassword();
  if (!allFieldsValid.value) {
    showInvalid.value = true;
    return;
  }
  emit('login', userCredentials);
};

// Verification
const verificationCode = ref<string[]>([]);

const instructions = computed(() => {
  if (loginMode.value) {
    return '';
  }
  if (props.mfaMethod === 'email') {
    return 'Check your inbox';
  }
  if (props.mfaMethod === 'app') {
    return 'Check your authenticator app';
  }
  return '';
});

const verifyAccount = () => {
  showInvalid.value = false;
  if (verificationCode.value.length < 6) {
    showInvalid.value = true;
    return;
  }
  const code = verificationCode.value.join('');
  emit('verify', code);
};

// Account mode
const accounts = computed(() => {
  if (!props.accounts) {
    return [];
  }
  return Object.keys(props.accounts).map((key) => {
    return {
      key,
      name: props.accounts?.[key]?.displayName,
    };
  });
});

// Go back to login
const backToLogin = () => {
  verificationCode.value = [];
  emit('set-mode', 'login');
};
</script>

<template>
  <div class="grid gap-2 text-center">
    <h1 class="mb-3 text-3xl font-bold">
      {{ verifyMode ? $t('auth_verify_title') : $t('auth_login_title') }}
    </h1>
    <!-- <p v-if="instructions" class="text-xs text-muted-foreground">
      {{ instructions }}
    </p> -->
    <p v-if="verifyMode && mfaMethod.length > 0" class="text-muted-foreground">
      {{ $t('auth_verify_description') }} <strong>{{ mfaMethod }}</strong>
    </p>
    <p v-if="accountMode" class="text-muted-foreground">
      {{ $t('auth_select_account') }}
    </p>
  </div>

  <Alert v-if="showInvalid" variant="destructive">
    <LucideTriangleAlert class="size-4" />
    <AlertTitle>
      {{ alertTitle }}
    </AlertTitle>
    <AlertDescription>
      {{ alertDescription }}
    </AlertDescription>
  </Alert>

  <form
    v-if="loginMode || verifyMode"
    class="grid gap-4"
    @submit.prevent="loginMode ? login() : verifyAccount()"
  >
    <div v-if="loginMode" class="grid gap-2">
      <Label for="email">{{ $t('email') }}</Label>
      <Input
        id="email"
        ref="emailInput"
        v-model="email"
        type="email"
        tabindex="1"
        placeholder="user@geins.io"
        required
        :valid="emailValid"
        @blur="validateEmail"
        @keydown.enter="login"
      />
    </div>

    <div v-if="loginMode" class="grid gap-2">
      <div class="flex items-center">
        <Label for="password">
          {{ $t('password') }}
        </Label>
        <!-- <a
          href="/forgot-password"
          class="ml-auto inline-block text-sm underline"
          tabindex="3"
        >
          Forgot your password?
        </a> -->
      </div>
      <Input
        id="password"
        v-model="password"
        type="password"
        tabindex="2"
        required
        :valid="passwordValid"
        @blur="validatePassword"
        @keydown.enter="login"
      />
    </div>

    <div v-if="verifyMode" class="grid gap-3">
      <div class="flex justify-center">
        <PinInput
          id="pin-input"
          v-model="verificationCode"
          placeholder="○"
          :otp="true"
          @complete="verifyAccount"
        >
          <PinInputGroup>
            <PinInputInput v-for="(id, index) in 6" :key="id" :index="index" />
          </PinInputGroup>
        </PinInput>
      </div>
    </div>

    <Button class="w-full" :loading="pending">
      {{ loginMode ? $t('log_in') : $t('verify') }}
    </Button>
  </form>
  <div v-if="accountMode">
    <ul v-if="!pending" class="flex flex-col gap-2">
      <li v-for="account in accounts" :key="account.key" class="w-full">
        <Button class="w-full" @click="$emit('set-account', account.key)">
          {{ account.name }}
        </Button>
      </li>
    </ul>
    <div
      v-else
      class="relative flex items-center justify-center text-muted-foreground"
    >
      <LucideLoaderCircle class="size-10 animate-spin" />
    </div>
  </div>
  <Button v-if="verifyMode || accountMode" variant="link" @click="backToLogin">
    {{ $t('back_to_login') }}
  </Button>
</template>
