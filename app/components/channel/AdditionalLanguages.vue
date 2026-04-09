<script setup lang="ts">
import type { ChannelLanguageAssignment, Language } from '#shared/types';

const { t } = useI18n();

const props = defineProps<{
  allLanguages: Language[];
  channelLanguages: ChannelLanguageAssignment[];
}>();

const emit = defineEmits<{
  add: [languages: ChannelLanguageAssignment[]];
  update: [language: ChannelLanguageAssignment];
}>();

// Additional languages (everything except index 0 = default)
const additionalLanguages = computed(() => {
  return props.channelLanguages.slice(1);
});

// Table rows enriched with name from allLanguages
const tableRows = computed(() => {
  return additionalLanguages.value.map((lang) => {
    const full = props.allLanguages.find((l) => l._id === lang._id);
    return {
      _id: lang._id,
      name: full?.name || lang._id,
      active: lang.active,
    };
  });
});

// Available languages for add dialog (not already assigned)
const assignedIds = computed(
  () => new Set(props.channelLanguages.map((l) => l._id)),
);

const availableLanguages = computed(() => {
  return props.allLanguages
    .filter((l) => !assignedIds.value.has(l._id))
    .map((l) => ({
      _id: l._id,
      name: l.name,
    }));
});

// Add dialog state
const addDialogOpen = ref(false);
const selectedLanguageIds = ref<string[]>([]);

const openAddDialog = () => {
  selectedLanguageIds.value = [];
  addDialogOpen.value = true;
};

const confirmAdd = () => {
  const newAssignments: ChannelLanguageAssignment[] =
    selectedLanguageIds.value.map((id) => ({
      _id: id,
      active: true,
    }));
  emit('add', newAssignments);
  addDialogOpen.value = false;
  selectedLanguageIds.value = [];
};

const handleToggleActive = (
  row: { _id: string; active: boolean },
  value: boolean,
) => {
  emit('update', {
    _id: row._id,
    active: value,
  });
};
</script>

<template>
  <!-- Additional languages sub-section -->
  <Item class="px-0 pt-4">
    <ItemContent>
      <ItemTitle class="text-base font-bold">
        {{ t('channels.additional_languages') }}
      </ItemTitle>
      <ItemDescription>
        {{ t('channels.additional_languages_description') }}
      </ItemDescription>
    </ItemContent>
    <ItemActions>
      <Button variant="outline" size="sm" @click="openAddDialog">
        <LucidePlus class="mr-1 size-3.5" />
        {{ t('add') }}
      </Button>
    </ItemActions>
  </Item>

  <!-- Additional languages table -->
  <div v-if="tableRows.length">
    <table class="w-full">
      <thead>
        <tr class="border-b">
          <th class="px-4 py-2 text-left text-sm font-bold">
            {{ t('language') }}
          </th>
          <th class="px-6 py-2 text-right text-sm font-bold">
            {{ t('active') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in tableRows"
          :key="row._id"
          class="border-b last:border-b-0"
        >
          <td class="px-4 py-3">
            <ChannelLanguageIcon :language-id="row._id" :name="row.name" />
          </td>
          <td class="px-6 py-3 text-right">
            <Switch
              :model-value="row.active"
              @update:model-value="handleToggleActive(row, $event)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <Empty v-else class="gap-2 border-y p-0">
    <EmptyMedia variant="icon" class="size-8">
      <LucideLanguages class="size-5" />
    </EmptyMedia>
    <EmptyHeader>
      <EmptyDescription>
        {{ t('channels.additional_languages_empty') }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>

  <!-- Add language dialog -->
  <Dialog v-model:open="addDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ t('add_entity', { entityName: 'language' }, 2) }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('add_entity', { entityName: 'language' }, 2) }}
        </DialogDescription>
      </DialogHeader>
      <FormInputTagsSearch
        v-model="selectedLanguageIds"
        :data-set="availableLanguages"
        entity-name="language"
        disable-teleport
      >
        <template #item="{ item }">
          <ChannelLanguageIcon
            v-if="item"
            :language-id="item._id"
            :name="item.name"
            size="sm"
          />
        </template>
        <template #tag="{ item }">
          <ChannelLanguageIcon
            v-if="item"
            :language-id="item._id"
            :name="item.name"
            size="sm"
          />
        </template>
      </FormInputTagsSearch>
      <DialogFooter>
        <Button variant="outline" @click="addDialogOpen = false">
          {{ t('cancel') }}
        </Button>
        <Button :disabled="!selectedLanguageIds.length" @click="confirmAdd">
          {{ t('add') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
