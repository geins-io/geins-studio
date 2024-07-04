<script setup lang="ts">
import { cn } from '@/lib/utils';
import type { LoginCredentials } from '@/types/auth/Auth';
import Input from '@/components/ui/input/Input.vue';
import { ReloadIcon, ExclamationTriangleIcon } from '@radix-icons/vue';

const emit = defineEmits(['login']);

const props = withDefaults(
  defineProps<{
    pending: boolean;
    showInvalid: boolean;
  }>(),
  {
    pending: false,
    showInvalid: false,
  },
);

const pending = ref(props.pending);
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const emailValid = ref(true);
const passwordValid = ref(true);
const emailInput = ref<typeof Input | null>(null);
const showInvalid = ref(props.showInvalid);

watch(
  () => props.pending,
  (value) => {
    pending.value = value;
  },
);

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

onMounted(() => {
  const el = emailInput.value?.$el;
  if (el instanceof HTMLInputElement) {
    el.focus();
  }
});
</script>
<template>
  <div class="grid gap-2 text-center">
    <h1 class="text-3xl font-bold">Merchant Center</h1>
  </div>
  <Alert v-if="showInvalid" variant="destructive">
    <ExclamationTriangleIcon class="w-4 h-4" />
    <AlertTitle>Invalid credentials</AlertTitle>
    <AlertDescription>
      Please check your email and password and try again.
    </AlertDescription>
  </Alert>
  <div class="grid gap-4">
    <div class="grid gap-2">
      <Label for="email">Email</Label>
      <Input
        id="email"
        v-model="email"
        ref="emailInput"
        type="email"
        placeholder="user@geins.io"
        required
        :valid="emailValid"
        @blur="validateEmail"
        @keydown.enter="login"
      />
    </div>
    <div class="grid gap-2">
      <div class="flex items-center">
        <Label for="password">Password</Label>
        <a
          href="/forgot-password"
          class="ml-auto inline-block text-sm underline"
        >
          Forgot your password?
        </a>
      </div>
      <Input
        id="password"
        v-model="password"
        type="password"
        required
        :valid="passwordValid"
        @blur="validatePassword"
        @keydown.enter="login"
      />
    </div>
    <div class="grid gap-2">
      <div class="flex items-center space-x-2.5">
        <Checkbox id="checkbox" v-model="rememberMe" />
        <Label for="checkbox" class="ml-2 text-sm">Remember this device</Label>
      </div>
    </div>
    <Button :disabled="pending" type="submit" class="w-full" @click="login">
      <ReloadIcon v-if="pending" class="w-4 h-4 mr-2 animate-spin" />
      Login
    </Button>
  </div>
</template>
