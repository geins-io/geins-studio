<script setup lang="ts">
import * as z from 'zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import type {
  LoginCredentials,
  AuthFormMode,
  LoginFormValues,
  ForgotPasswordFormValues,
  ResetPasswordFormValues,
} from '#shared/types';

const props = withDefaults(
  defineProps<{
    loading: boolean;
    showInvalid: boolean;
    mode: AuthFormMode;
    mfaMethod?: string;
    accounts?: AuthAccounts[];
    token?: string;
  }>(),
  {
    loading: false,
    showInvalid: false,
    mfaMethod: '',
  },
);

const emit = defineEmits<{
  (event: 'login', credentials: LoginCredentials): void;
  (event: 'verify' | 'set-account', data: string): void;
  (event: 'set-mode', mode: AuthFormMode): void;
}>();

const { geinsLogError } = useGeinsLog('components/AuthForm.vue');
const { t } = useI18n();
const config = useRuntimeConfig();
const { $geinsApi } = useNuxtApp();
const userApi = repo.user($geinsApi);

// Computed mode helpers
const loginMode = computed(() => props.mode === 'login');
const verifyMode = computed(() => props.mode === 'verify');
const accountMode = computed(() => props.mode === 'account');
const forgotPasswordMode = computed(() => props.mode === 'forgot-password');
const resetPasswordMode = computed(() => props.mode === 'reset-password');

// State management
const resetRequestSuccess = ref(false);
const resetSuccess = ref(false);
const resetLoading = ref(false);
const verificationCode = ref<string[]>([]);

// Create a unified form schema that switches based on mode
const formSchema = computed(() => {
  if (loginMode.value) {
    return toTypedSchema(
      z.object({
        email: z.string().email({ message: t('form.invalid_email') }),
        password: z.string().min(6, { message: t('auth.password_min_length') }),
        rememberMe: z.boolean().optional(),
      }),
    );
  }

  if (forgotPasswordMode.value) {
    return toTypedSchema(
      z.object({
        email: z.string().email({ message: t('form.invalid_email') }),
      }),
    );
  }

  if (resetPasswordMode.value) {
    return toTypedSchema(
      z
        .object({
          newPassword: z
            .string()
            .min(6, { message: t('auth.password_min_length') }),
          passwordRepeat: z
            .string()
            .min(6, { message: t('auth.password_min_length') }),
        })
        .refine((data) => data.newPassword === data.passwordRepeat, {
          message: t('auth.passwords_not_matching'),
          path: ['passwordRepeat'],
        }),
    );
  }

  // Default empty schema
  return toTypedSchema(z.object({}));
});

// Single form instance that updates based on mode
const form = useForm({
  validationSchema: formSchema,
});

// Reset form when mode changes
watch(
  () => props.mode,
  (newMode, oldMode) => {
    let email = '';
    if (oldMode === 'login' && newMode === 'forgot-password') {
      const values = form.values as LoginFormValues;
      email = values.email || '';
    }
    form.resetForm();
    verificationCode.value = [];
    resetRequestSuccess.value = false;
    resetSuccess.value = false;
    if (newMode === 'forgot-password') {
      form.setValues({
        email,
      });
    }
  },
);

// Watch for external showInvalid changes
watchEffect(() => {
  if (props.showInvalid) {
    form.validate();
  }
});

// Auto-focus email input on mount
onMounted(async () => {
  if (loginMode.value) {
    await nextTick();
    const emailField = document.getElementById('email');
    if (emailField instanceof HTMLInputElement) {
      emailField.focus();
    }
  }
});

// Feedback messages
const feedbackVisible = computed(() => {
  return props.showInvalid || resetRequestSuccess.value || resetSuccess.value;
});

const feedbackType = computed(() => {
  if (resetSuccess.value) return 'positive';
  if (resetRequestSuccess.value) return 'info';
  if (props.showInvalid) return 'negative';
  return 'info';
});

const feedbackTitle = computed(() => {
  if (resetSuccess.value) return t('auth.password_reset_success_title');
  if (resetRequestSuccess.value)
    return t('auth.password_reset_requested_title');
  if (props.showInvalid) {
    switch (props.mode) {
      case 'login':
        return t('auth.invalid_credentials_title');
      case 'verify':
        return t('auth.invalid_code_title');
      case 'reset-password':
        return t('auth.reset_password_error_title');
      default:
        return t('auth.general_error_title');
    }
  }
  return '';
});

const feedbackDescription = computed(() => {
  if (resetSuccess.value) return t('auth.password_reset_success_description');
  if (resetRequestSuccess.value)
    return t('auth.password_reset_requested_description');
  if (props.showInvalid) {
    switch (props.mode) {
      case 'login':
        return t('auth.invalid_credentials_description');
      case 'verify':
        return t('auth.invalid_code_description');
      case 'reset-password':
        return t('auth.reset_password_error_description');
      default:
        return t('auth.general_error_description');
    }
  }
  return '';
});

// Account selection
const accounts = computed(() => props.accounts || []);

// Button text
const buttonText = computed(() => {
  if (verifyMode.value) return t('verify');
  if (forgotPasswordMode.value) return t('send_reset_link');
  if (resetPasswordMode.value) return t('reset_password');
  return t('log_in');
});

// Form submission handlers
const handleLogin = async () => {
  const validation = await form.validate();
  if (!validation.valid) return;

  const values = form.values as LoginFormValues;
  const credentials: LoginCredentials = {
    username: values.email || '',
    password: values.password || '',
    rememberMe: values.rememberMe || false,
  };

  emit('login', credentials);
};

const handleVerify = () => {
  if (verificationCode.value.length < 6) return;
  const code = verificationCode.value.join('');
  emit('verify', code);
};

const handleForgotPassword = async () => {
  const validation = await form.validate();
  if (!validation.valid) return;

  resetLoading.value = true;
  try {
    const values = form.values as ForgotPasswordFormValues;
    await userApi.password.beginRestore(
      values.email || '',
      `${config.public.baseUrl}/auth/reset-password?token={token}`,
    );
    resetRequestSuccess.value = true;
  } catch (error) {
    const message = getErrorMessage(error);
    geinsLogError('error requesting password reset:', message);
    // Re-emit to parent for error handling
    emit('set-mode', 'forgot-password');
  } finally {
    resetLoading.value = false;
  }
};

const handleResetPassword = async () => {
  const validation = await form.validate();
  if (!validation.valid) return;

  resetLoading.value = true;
  try {
    const values = form.values as ResetPasswordFormValues;
    await userApi.password.restore(
      String(props.token),
      values.newPassword || '',
    );
    resetSuccess.value = true;
  } catch (error) {
    const message = getErrorMessage(error);
    geinsLogError('error resetting password:', message);
    // Re-emit to parent for error handling
    emit('set-mode', 'reset-password');
  } finally {
    resetLoading.value = false;
  }
};

const handleSubmit = () => {
  if (loginMode.value) {
    handleLogin();
  } else if (verifyMode.value) {
    handleVerify();
  } else if (forgotPasswordMode.value) {
    handleForgotPassword();
  } else if (resetPasswordMode.value) {
    handleResetPassword();
  }
};

const backToLogin = () => {
  verificationCode.value = [];
  resetRequestSuccess.value = false;
  resetSuccess.value = false;
  emit('set-mode', 'login');
};
</script>

<template>
  <div class="grid gap-4">
    <div class="grid gap-2 text-center">
      <h1 class="mb-2 text-3xl font-bold">
        {{ verifyMode ? $t('auth.verify_title') : $t('auth.login_title') }}
      </h1>
      <p
        v-if="verifyMode && mfaMethod.length > 0"
        class="text-muted-foreground"
      >
        {{ $t('auth.verify_description') }} <strong>{{ mfaMethod }}</strong>
      </p>
      <p v-if="accountMode" class="text-muted-foreground">
        {{ $t('auth.select_account') }}
      </p>
    </div>

    <Feedback v-if="feedbackVisible" :type="feedbackType">
      <template #title>
        {{ feedbackTitle }}
      </template>
      <template #description>
        {{ feedbackDescription }}
      </template>
      <template v-if="resetSuccess" #actions>
        <Button variant="secondary" size="sm" as-child>
          <NuxtLink to="/auth/login">{{ $t('auth.go_to_login') }}</NuxtLink>
        </Button>
      </template>
    </Feedback>

    <!-- Login Form -->
    <form v-if="loginMode" class="grid gap-4" @submit.prevent="handleSubmit">
      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel>{{ $t('email') }}</FormLabel>
          <FormControl>
            <Input
              id="email"
              v-bind="componentField"
              type="email"
              tabindex="1"
              placeholder="user@geins.io"
              autocomplete="email"
              @keydown.enter="handleSubmit"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <div class="flex items-center">
            <FormLabel>{{ $t('password') }}</FormLabel>
            <Button
              variant="link"
              tabindex="3"
              type="button"
              class="ml-auto h-auto p-0 pb-1 text-xs"
              @click="$emit('set-mode', 'forgot-password')"
            >
              {{ $t('forgot_password') }}
            </Button>
          </div>
          <FormControl>
            <Input
              v-bind="componentField"
              type="password"
              tabindex="2"
              autocomplete="current-password"
              @keydown.enter="handleSubmit"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button class="w-full" :loading="loading">
        {{ buttonText }}
      </Button>
    </form>

    <!-- Forgot Password Form -->
    <form
      v-else-if="forgotPasswordMode"
      class="grid gap-4"
      @submit.prevent="handleSubmit"
    >
      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel>{{ $t('email') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="email"
              tabindex="1"
              placeholder="user@geins.io"
              autocomplete="email"
              @keydown.enter="handleSubmit"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button class="w-full" :loading="resetLoading">
        {{ buttonText }}
      </Button>
    </form>

    <!-- Reset Password Form -->
    <form
      v-else-if="resetPasswordMode"
      class="grid gap-4"
      @submit.prevent="handleSubmit"
    >
      <FormField v-slot="{ componentField }" name="newPassword">
        <FormItem>
          <FormLabel>{{ $t('new_password') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="password"
              tabindex="1"
              autocomplete="new-password"
              @keydown.enter="handleSubmit"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="passwordRepeat">
        <FormItem>
          <FormLabel>{{ $t('repeat_password') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="password"
              tabindex="2"
              autocomplete="new-password"
              @keydown.enter="handleSubmit"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button class="w-full" :loading="resetLoading">
        {{ buttonText }}
      </Button>
    </form>

    <!-- Verification Form -->
    <div v-else-if="verifyMode" class="grid gap-3">
      <div class="flex justify-center">
        <PinInput
          id="pin-input"
          v-model="verificationCode"
          placeholder="○"
          :otp="true"
          @complete="handleVerify"
        >
          <PinInputGroup>
            <PinInputSlot v-for="(id, index) in 6" :key="id" :index="index" />
          </PinInputGroup>
        </PinInput>
      </div>
      <Button class="w-full" :loading="loading">
        {{ buttonText }}
      </Button>
    </div>

    <!-- Account Selection -->
    <div v-else-if="accountMode">
      <ul v-if="!loading" class="flex flex-col gap-2">
        <li
          v-for="account in accounts"
          :key="account.accountKey"
          class="w-full"
        >
          <Button
            class="w-full"
            @click="$emit('set-account', account.accountKey)"
          >
            {{ account.displayName }}
          </Button>
        </li>
      </ul>
      <div
        v-else
        class="text-muted-foreground relative flex items-center justify-center"
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
  </div>
</template>
