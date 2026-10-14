<script setup lang="ts">
// Inline folder name input, for a new folder or (with `initialValue`) a
// rename. Enter/blur commits a non-empty, changed name, Esc cancels. The
// caller wraps it in a `SidebarMenuItem` (a new row) or renders it in a row.
// A committed name stays, locked with a spinner, until the caller unmounts it.
const props = defineProps<{
  /** Prefilled + selected for a rename; committing it unchanged cancels. */
  initialValue?: string;
}>();
const emit = defineEmits<{ create: [name: string]; cancel: [] }>();

const name = ref(props.initialValue ?? '');
const inputRef = ref<HTMLInputElement | null>(null);
const errorId = useId();
// A folder name is one path segment, so the API refuses a slash.
const hasSlash = computed(() => name.value.includes('/'));

onMounted(() => {
  inputRef.value?.focus();
  inputRef.value?.select();
});

// Committing hides this input (parent sets `addingTop`/`addingChild` false),
// which unmounts it and fires @blur → a second commit. Guard so exactly one
// create/cancel is emitted, otherwise Enter creates the folder twice.
const done = ref(false);
const saving = ref(false);
function finish(action: 'create' | 'cancel') {
  if (done.value) return;
  done.value = true;
  const value = name.value.trim();
  if (
    action === 'create' &&
    value &&
    value !== props.initialValue &&
    !hasSlash.value
  ) {
    saving.value = true;
    emit('create', value);
  } else {
    emit('cancel');
  }
}

// Enter on a name with a slash keeps editing, so the message stays readable;
// blur still leaves (as a cancel).
function onEnter() {
  if (!hasSlash.value) finish('create');
}
</script>

<template>
  <div class="px-2 py-1">
    <div class="relative">
      <input
        ref="inputRef"
        v-model="name"
        :placeholder="$t('asset_library.folder_name')"
        :aria-label="$t('asset_library.folder_name')"
        :aria-invalid="hasSlash"
        :aria-describedby="hasSlash ? errorId : undefined"
        :aria-busy="saving || undefined"
        :readonly="saving"
        class="border-input bg-background focus-visible:ring-ring aria-invalid:border-destructive h-7 w-full rounded-md border ps-2 pe-7 text-sm focus-visible:ring-1 focus-visible:outline-none"
        @keydown.enter.prevent="onEnter"
        @keydown.esc.prevent="finish('cancel')"
        @blur="finish('create')"
      />
      <LucideLoaderCircle
        v-if="saving"
        class="text-muted-foreground absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin"
        aria-hidden="true"
      />
    </div>
    <p v-if="hasSlash" :id="errorId" class="text-destructive mt-1 text-xs">
      {{ $t('asset_library.asset_name_no_slash') }}
    </p>
  </div>
</template>
