<script lang="ts" setup>
import AuthFormCredentials from '@/components/auth/AuthFormCredentials.vue';
import AuthFormDFA from '@/components/auth/AuthFormDFA.vue';
// meta
definePageMeta({
    layout: 'auth',
    auth: {
        unauthenticatedOnly: true,
        navigateAuthenticatedTo: '/',
    }
})

// composables
const { data, signIn } = useAuth()
const router = useRouter();

// refs
const dfa = ref({ username: '', token: '', sentTo: '' });
const pending = ref(false);
const showInvalid = ref(false);
const step = ref('LOGIN');

// functions
async function handleLogin(user: any) {
    pending.value = true;
    showInvalid.value = false;

    if (!user.username || !user.password) {
        showInvalid.value = true;
        pending.value = false;
        return;
    }

    const rememberMe = user.checkbox || false;
    const loginResult = await signIn('credentials', { username: user.username, password: user.password, rememberMe, redirect: false })

    console.log('result: ', loginResult);
    pending.value = false;

    if ((loginResult as any).error || (loginResult as any).status === false) {
        showInvalid.value = true;
        pending.value = false;
        const error = (loginResult as any).error;
        console.log('error: ', error);
        return;
    }
    if ((loginResult as any).ok === true) {
        // check if dfa
        if ((data.value as any) && (data.value as any).dfa?.active === true) {
            const dfaData = (data.value as any).dfa;
            dfa.value.username = dfaData.username;
            dfa.value.sentTo = dfaData.sentTo;
            dfa.value.token = dfaData.token;
            step.value = 'DFA';
            return;
        }
    }
}
async function handleVerify(code: any) {
    pending.value = true;
    showInvalid.value = false;
    const verifyResult = await signIn('credentials', { username: dfa.value.username, dfaToken: dfa.value.token, dfaCode: code, dfa: true, redirect: false })
    if ((verifyResult as any).error) {
        showInvalid.value = true;
        pending.value = false;
        console.log('error: ', (verifyResult as any).error);
        return;
    }
    pending.value = false;

    console.log('DONE: data', data.value);
    // redirect to home
    router.push('/');
}
</script>

<template>
    <AuthFormCredentials v-if="step === 'LOGIN'" :pending="pending" :show-invalid="showInvalid" @login="handleLogin" />
    <AuthFormDFA v-if="step === 'DFA'" :pending="pending" :show-invalid="showInvalid" :sent-to="dfa.sentTo"
        @verify="handleVerify" />
</template>
