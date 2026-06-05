<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  defaultName: string;
  defaultDescription?: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  save: [payload: { name: string; description?: string }];
}>();

const name = ref('');
const description = ref('');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = props.defaultName;
      description.value = props.defaultDescription ?? '';
    }
  },
);

const canSave = computed(() => name.value.trim().length > 0);

function onSave() {
  if (!canSave.value) return;
  emit('save', {
    name: name.value.trim(),
    description: description.value.trim() || undefined,
  });
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Save as template</DialogTitle>
        <DialogDescription
          >Save this node configuration for reuse in other
          workflows.</DialogDescription
        >
      </DialogHeader>
      <div class="space-y-3 py-2">
        <div class="space-y-1.5">
          <label class="text-sm font-medium">Name</label>
          <Input
            v-model="name"
            placeholder="Template name"
            @keydown.enter="onSave"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium"
            >Description
            <span class="text-muted-foreground font-normal"
              >(optional)</span
            ></label
          >
          <Textarea
            v-model="description"
            placeholder="What does this template do?"
            rows="2"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)"
          >Cancel</Button
        >
        <Button :disabled="!canSave" @click="onSave">
          <LucideBookmarkPlus class="mr-1.5 h-3.5 w-3.5" />
          Save template
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
