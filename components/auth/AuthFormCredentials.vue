<script setup lang="ts">
import { cn } from '@/lib/utils';
// emits
const emit = defineEmits(['login']);

// props 
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

// refs
const pending = ref(props.pending);

const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const usernameValid = ref(true);
const passwordValid = ref(true);
const showInvalid = ref(props.showInvalid);

// watch props
watch(() => props.pending, (value) => {
    pending.value = value;
});
// watch pending
watch(() => pending.value, (value) => {
    console.log('pending: ', value);
});

// validate method
const validate = () => {
    usernameValid.value = (username.value.includes('@'));
    passwordValid.value = (password.value.length > 6);
    return usernameValid.value && passwordValid.value;
}

// methods
const login = () => {
    const userCredentials = {
        username: username.value,
        password: password.value,
        rememberMe: rememberMe.value,
    }
    if (!validate()) {
        showInvalid.value = true;
        return;
    }

    console.log('login', userCredentials);
    emit('login', userCredentials);
}
</script>
<template>
    <div class="grid gap-2 text-center">
        <h1 class="text-3xl font-bold">
            Login
        </h1>
        <p class="text-balance text-muted-foreground">
            Enter your email below to login to your account
        </p>
    </div>
    <div class="grid gap-4">
        <div class="grid gap-2">
            <Label for="email">Username</Label>
            <Input id="email" v-model="username" type="email" placeholder="m@example.com" required
                :class="cn(`${!usernameValid ? 'border-rose-600' : ''}`)" />

        </div>
        <div class="grid gap-2">
            <div class="flex items-center">
                <Label for="password">Password</Label>
                <a href="/forgot-password" class="ml-auto inline-block text-sm underline">
                    Forgot your password?
                </a>
            </div>
            <Input id="password" v-model="password" type="password" required
                :class="cn(`${!passwordValid ? 'border-rose-600' : ''}`)" />
        </div>
        <div class="grid gap-2">
            <div>
                <Checkbox id="checkbox" v-model="rememberMe" />
                <Label for="checkbox" class="ml-2 text-sm">Remember this device</Label>
            </div>
        </div>
        <Button :disabled="pending" type="submit" class="w-full" @click="login">
            Login
        </Button>
        <div v-if="showInvalid" class="grid gap-2">
            <div>
                <p>Invalid Credentials</p>
            </div>
        </div>

    </div>
</template>