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
        console.log('loginResult :: OK:', loginResult);
        console.log('loginResult :: DATA ', data.value);
        // check if dfa
        if ((data.value as any) && (data.value as any).dfa?.active === true) {
            const dfaData = (data.value as any).dfa;
            console.log('THIS IS A DFA LOGIN: ', dfaData);
            dfa.value.token = (data.value as any).dfa.token;
            dfa.value.username = (data.value as any).dfa.username;
            dfa.value.sentTo = (data.value as any).dfa.sentTo;
            step.value = 'DFA';
            return;
        }
    }

    // TODO: handle errors
}
async function handleVerify(code: any) {
    pending.value = true;
    showInvalid.value = false;
    console.log('dfa.value: ', dfa.value);

    const verifyResult = await signIn('credentials', { username: dfa.value.username, dfa: dfa.value, redirect: false })
    console.log('verifyResult: ', verifyResult);

    if ((verifyResult as any).error) {
        showInvalid.value = true;
        pending.value = false;
        console.log('error: ', (verifyResult as any).error);
        return;
    }

    // redirect to home
    router.push('/');


    pending.value = false;
}
</script>

<template>
    <AuthFormCredentials v-if="step === 'LOGIN'" :pending="pending" :show-invalid="showInvalid" @login="handleLogin" />
    <AuthFormDFA v-if="step === 'DFA'" :pending="pending" :show-invalid="showInvalid" :sent-to="dfa.sentTo"
        @verify="handleVerify" />
</template>
