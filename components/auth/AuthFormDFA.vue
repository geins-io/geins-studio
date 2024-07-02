<script setup lang="ts">
// emits
const emit = defineEmits(['verify']);

// composables
const route = useRoute();
const router = useRouter();

// props
const props = withDefaults(
    defineProps<{
        pending: boolean;
        showInvalid: boolean;
        sentTo: string;
    }>(),
    {
        pending: false,
        showInvalid: false,
        sentTo: '',
    },
);


// refs
const sentTo = ref(props.sentTo);
const value = ref<string[]>([])

// verify account
async function verifyAccount(e: string[]) {
    if (value.value.length < 6) {
        return;
    }
    const code = value.value.join('');
    emit("verify", code);
}
</script>
<template>
    <div class="grid gap-2 text-center">
        <h1 class="text-3xl font-bold">
            Verify Account
        </h1>
        <p v-if="sentTo.length > 0" class="text-balance text-muted-foreground">
            Sento to {{ sentTo }}
        </p>
    </div>
    <div class="grid gap-4">
        <div class="grid gap-2">
            <div class="flex items-center">
                <Label for="code">Enter the 6-digit code sent to {{ sentTo }}</Label>
                <a href="#" class="ml-auto inline-block text-sm underline">
                    Resend code
                </a>
            </div>
            <div class="flex justify-center">
                <PinInput id="pin-input" v-model="value" placeholder="○" @complete="verifyAccount">
                    <PinInputGroup>
                        <PinInputInput v-for="(id, index) in 6" :key="id" :index="index" />
                    </PinInputGroup>
                </PinInput>
            </div>
        </div>
        <Button type="submit" class="w-full">
            Verify
        </Button>
    </div>
</template>