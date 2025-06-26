<script setup lang="ts">
import type { LoginCredentials, AuthFormMode } from '#shared/types';
import { Input } from '#components';

const emit = defineEmits(['login', 'verify', 'set-account', 'set-mode']);

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    pending: boolean;
    showInvalid: boolean;
    mode: AuthFormMode;
    mfaMethod?: string;
    accounts?: AuthAccounts;
    token?: string;
  }>(),
  {
    pending: false,
    showInvalid: false,
    mfaMethod: '',
  },
);

const { geinsLogError } = useGeinsLog('components/AuthForm.vue');
const { $geinsApi } = useNuxtApp();
const userApi = repo.user($geinsApi);
const baseUrl = useRuntimeConfig().public.baseUrl;

// Global
const loginMode = computed(() => props.mode === 'login');
const verifyMode = computed(() => props.mode === 'verify');
const accountMode = computed(() => props.mode === 'account');
const forgotPasswordMode = computed(() => props.mode === 'forgot-password');
const resetPasswordMode = computed(() => props.mode === 'reset-password');
const showInvalid = ref(props.showInvalid);
const pending = toRef(props, 'pending');
const resetRequestSuccess = ref(false);
const resetSuccess = ref(false);
const resetLoading = ref(false);
const newPassword = ref('');
const passwordRepeat = ref('');

const passwordsMatching = computed(() => {
  return newPassword.value === passwordRepeat.value;
});

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
    case 'reset-password':
      return passwordsMatching.value
        ? 'Something went wrong'
        : 'Passwords not matching';
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
    case 'reset-password':
      return passwordsMatching.value
        ? 'Your token is invalid or expired. Please try again.'
        : 'Please check your passwords and try again.';
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

const _instructions = computed(() => {
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

const beginRestorePassword = async () => {
  showInvalid.value = false;
  validateEmail();
  if (!emailValid.value) {
    showInvalid.value = true;
    return;
  }
  resetLoading.value = true;
  try {
    await userApi.password.beginRestore(
      email.value,
      `${baseUrl}/auth/reset-password?token={token}`,
    );
    resetRequestSuccess.value = true;
  } catch (error) {
    showInvalid.value = true;
    const message = getErrorMessage(error);
    geinsLogError('error saving buyer:', message);
  } finally {
    resetLoading.value = false;
  }
};

const restorePassword = async () => {
  showInvalid.value = false;

  if (newPassword.value !== passwordRepeat.value) {
    showInvalid.value = true;
    return;
  }
  resetLoading.value = true;
  try {
    await userApi.password.restore(String(props.token), newPassword.value);
    resetSuccess.value = true;
  } catch (error) {
    showInvalid.value = true;
    const message = getErrorMessage(error);
    geinsLogError('error restoring password:', message);
  } finally {
    resetLoading.value = false;
  }
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

const buttonText = computed(() => {
  if (verifyMode.value) {
    return t('verify');
  }
  if (forgotPasswordMode.value || resetPasswordMode.value) {
    return t('reset_password');
  }
  return t('log_in');
});

const handleSubmit = () => {
  if (loginMode.value) {
    login();
  } else if (verifyMode.value) {
    verifyAccount();
  } else if (forgotPasswordMode.value || resetPasswordMode.value) {
    beginRestorePassword();
  }
};

// Go back to login
const backToLogin = () => {
  verificationCode.value = [];
  resetRequestSuccess.value = false;
  resetSuccess.value = false;
  emit('set-mode', 'login');
};
</script>

<template>
  <div class="grid gap-2 text-center">
    <h1 class="mb-2 text-3xl font-bold">
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
  <Alert v-if="resetRequestSuccess" variant="info">
    <LucideInfo class="size-4" />
    <AlertTitle> Password reset requested </AlertTitle>
    <AlertDescription>
      Check your email for instructions to reset your password.
    </AlertDescription>
  </Alert>
  <Alert v-if="resetSuccess" variant="positive">
    <LucideInfo class="size-4" />
    <AlertTitle> Password successfully reset </AlertTitle>
    <AlertDescription>
      You can now log in with your new password.
    </AlertDescription>
    <div class="mt-2">
      <Button variant="secondary" as-child>
        <NuxtLink to="/auth/login"> Go to login </NuxtLink>
      </Button>
    </div>
  </Alert>

  <form
    v-if="loginMode || verifyMode || forgotPasswordMode || resetPasswordMode"
    class="grid gap-4"
    @submit.prevent="handleSubmit"
  >
    <div v-if="loginMode || forgotPasswordMode" class="grid gap-2">
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
        @keydown.enter="loginMode ? login() : beginRestorePassword()"
      />
    </div>

    <div v-if="loginMode" class="grid gap-2">
      <div class="flex items-center">
        <Label for="password">
          {{ $t('password') }}
        </Label>
        <Button
          variant="link"
          tabindex="3"
          class="ml-auto h-auto p-0 pb-1 text-xs"
          @click="$emit('set-mode', 'forgot-password')"
        >
          {{ $t('forgot_password') }}
        </Button>
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

    <div v-if="resetPasswordMode" class="mt-3 grid gap-4">
      <div class="grid gap-2">
        <Label for="new-password">{{ $t('new_password') }}</Label>
        <Input
          id="new-password"
          v-model="newPassword"
          type="password"
          tabindex="1"
          required
          @keydown.enter="restorePassword"
        />
      </div>
      <div class="grid gap-2">
        <Label for="password-repeat">{{ $t('repeat_password') }}</Label>
        <Input
          id="password-repeat"
          v-model="passwordRepeat"
          type="password"
          tabindex="2"
          required
          @keydown.enter="restorePassword"
        />
      </div>
    </div>

    <Button class="w-full" :loading="pending || resetLoading">
      {{ buttonText }}
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
  <Button
    v-if="verifyMode || accountMode || forgotPasswordMode"
    variant="link"
    @click="backToLogin"
  >
    {{ $t('back_to_login') }}
  </Button>
</template>
