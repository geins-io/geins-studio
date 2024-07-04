<script setup lang="ts">
import { ReloadIcon, ExclamationTriangleIcon } from '@radix-icons/vue';

const emit = defineEmits(['verify']);

const props = withDefaults(
  defineProps<{
    pending: boolean;
    showInvalid: boolean;
    sentTo: string;
    username: string;
  }>(),
  {
    pending: false,
    showInvalid: false,
    sentTo: '',
  },
);

const sentTo = ref(props.sentTo);
const value = ref<string[]>([]);

async function verifyAccount(e: string[]) {
  if (value.value.length < 6) {
    return;
  }
  const code = value.value.join('');
  emit('verify', code);
}
</script>
<template>
  <div class="flex flex-col text-center gap-2">
    <h1 class="text-3xl font-bold">Verify Account</h1>
    <p v-if="sentTo.length > 0" class="text-balance text-muted-foreground">
      Authenticating as <strong>{{ username }}</strong>
    </p>
  </div>
  <div class="grid gap-4">
    <div class="grid gap-3">
      <div class="flex flex-col items-center">
        <Label for="pin-input">
          Enter the 6-digit code from your {{ sentTo }}
        </Label>
      </div>
      <div class="flex justify-center">
        <PinInput
          id="pin-input"
          v-model="value"
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
    <div class="grid gap-2">
      <Button
        :disabled="pending"
        type="submit"
        class="w-full"
        @click="verifyAccount"
      >
        <ReloadIcon v-if="pending" class="w-4 h-4 mr-2 animate-spin" />
        Verify
      </Button>
    </div>
  </div>
</template>
