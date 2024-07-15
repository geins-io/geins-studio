<script setup lang="ts">
import type { LoginCredentials, AuthFormMode } from '@/types/auth/Auth';
import Input from '@/components/ui/input/Input.vue';
import { ReloadIcon, ExclamationTriangleIcon } from '@radix-icons/vue';
import { ref, watch, computed, onMounted } from 'vue';

const emit = defineEmits(['login', 'verify']);

const props = withDefaults(
  defineProps<{
    pending: boolean;
    showInvalid: boolean;
    sentTo?: string;
    username?: string;
    mode: AuthFormMode;
  }>(),
  {
    pending: false,
    showInvalid: false,
    sentTo: '',
    username: '',
  },
);

const loginMode = computed(() => props.mode === 'login');
const verifyMode = computed(() => props.mode === 'verify');
const showInvalid = ref(props.showInvalid);

watch(
  () => props.showInvalid,
  (value) => {
    showInvalid.value = value;
  },
);

// Login related refs
const email = ref('');
const emailInput = ref<typeof Input | null>(null);
const emailValid = ref(true);
const password = ref('');
const passwordValid = ref(true);
const rememberMe = ref(false);

// Verification related refs
const verificationCode = ref<string[]>([]);

// Login functions
const validatePassword = () => {
  passwordValid.value = password.value.length > 6;
};

const validateEmail = () => {
  emailValid.value = email.value.includes('@');
};

const allFieldsValid = computed(() => {
  return emailValid.value && passwordValid.value;
});

const login = () => {
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

// Verification functions
const verifyAccount = () => {
  if (verificationCode.value.length < 6) {
    return;
  }
  const code = verificationCode.value.join('');
  emit('verify', code);
};

onMounted(() => {
  if (loginMode.value) {
    const el = emailInput.value?.$el;
    if (el instanceof HTMLInputElement) {
      el.focus();
    }
  }
});
</script>

<template>
  <div class="grid gap-2 text-center">
    <h1 class="text-3xl font-bold">
      {{ loginMode ? 'Merchant Center' : 'Verify Account' }}
    </h1>
    <p
      v-if="verifyMode && sentTo.length > 0"
      class="text-balance text-muted-foreground"
    >
      Authenticating as <strong>{{ username }}</strong>
    </p>
  </div>

  <Alert v-if="showInvalid" variant="destructive">
    <ExclamationTriangleIcon class="w-4 h-4" />
    <AlertTitle>
      {{ loginMode ? 'Invalid credentials' : 'Invalid code' }}
    </AlertTitle>
    <AlertDescription>
      {{
        loginMode
          ? 'Please check your email and password and try again.'
          : 'Please check the code and try again.'
      }}
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

    <div v-if="loginMode" class="grid gap-2">
      <div class="flex items-center space-x-2.5">
        <Checkbox id="checkbox" v-model="rememberMe" />
        <Label for="checkbox" class="ml-2 text-sm">Remember this device</Label>
      </div>
    </div>

    <div v-if="verifyMode" class="grid gap-3">
      <div class="flex flex-col items-center">
        <Label for="pin-input">
          Enter the 6-digit code from your {{ sentTo }}
        </Label>
      </div>
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
      :disabled="pending"
      type="submit"
      class="w-full"
      @click="loginMode ? login() : verifyAccount()"
    >
      <ReloadIcon v-if="pending" class="w-4 h-4 mr-2 animate-spin" />
      {{ loginMode ? 'Login' : 'Verify' }}
    </Button>
  </div>
</template>
