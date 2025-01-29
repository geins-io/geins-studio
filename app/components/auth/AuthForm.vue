<script setup lang="ts">
import type { LoginCredentials, AuthFormMode } from '#shared/types';
import { Input } from '#components';
import { ExclamationTriangleIcon } from '@radix-icons/vue';

const emit = defineEmits(['login', 'verify', 'set-account']);

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

watch(
  () => props.showInvalid,
  (value) => {
    showInvalid.value = value;
  },
);

onMounted(() => {
  if (loginMode.value) {
    const el = emailInput.value?.$el;
    if (el instanceof HTMLInputElement) {
      el.focus();
    }
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
</script>

<template>
  <div class="grid gap-2 text-center">
    <h1 class="mb-3 text-3xl font-bold">
      {{ verifyMode ? 'Verify Account' : 'Merchant Center' }}
    </h1>
    <!-- <p v-if="instructions" class="text-xs text-muted-foreground">
      {{ instructions }}
    </p> -->
    <p v-if="verifyMode && mfaMethod.length > 0" class="text-muted-foreground">
      Enter the 6-digit code from your <strong>{{ mfaMethod }}</strong>
    </p>
    <p v-if="accountMode" class="text-muted-foreground">
      Select the account you want to access
    </p>
  </div>

  <Alert v-if="showInvalid" variant="destructive">
    <ExclamationTriangleIcon class="size-4" />
    <AlertTitle>
      {{ alertTitle }}
    </AlertTitle>
    <AlertDescription>
      {{ alertDescription }}
    </AlertDescription>
  </Alert>

  <div class="grid gap-4">
    <div v-if="loginMode" class="grid gap-2">
      <Label for="email">Email</Label>
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
        <Label for="password">Password</Label>
        <a
          href="/forgot-password"
          class="ml-auto inline-block text-sm underline"
          tabindex="3"
        >
          Forgot your password?
        </a>
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

    <Button
      v-if="loginMode || verifyMode"
      class="w-full"
      :loading="pending"
      @click="loginMode ? login() : verifyAccount()"
    >
      {{ loginMode ? 'Log in' : 'Verify' }}
    </Button>

    <ul v-if="accountMode && !pending" class="flex flex-col gap-2">
      <li v-for="account in accounts" :key="account.key" class="w-full">
        <Button class="w-full" @click="$emit('set-account', account.key)">
          {{ account.name }}
        </Button>
      </li>
    </ul>
    <div
      v-if="accountMode && pending"
      class="relative flex items-center justify-center text-muted-foreground"
    >
      <LucideLoaderCircle class="size-10 animate-spin" />
    </div>
  </div>
</template>
