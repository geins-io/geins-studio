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
      _type: lang._type,
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
      _type: 'language',
      active: true,
    }));
  emit('add', newAssignments);
  addDialogOpen.value = false;
  selectedLanguageIds.value = [];
};

// Edit sheet state
const editSheetOpen = ref(false);
const editingLanguage = ref<{
  _id: string;
  _type: string;
  name: string;
  active: boolean;
} | null>(null);
const editActive = ref(true);

const openEditSheet = (row: {
  _id: string;
  _type: string;
  name: string;
  active: boolean;
}) => {
  editingLanguage.value = row;
  editActive.value = row.active;
  editSheetOpen.value = true;
};

const confirmEdit = () => {
  if (!editingLanguage.value) return;
  emit('update', {
    _id: editingLanguage.value._id,
    _type: editingLanguage.value._type,
    active: editActive.value,
  });
  editSheetOpen.value = false;
  editingLanguage.value = null;
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
          <th class="px-4 py-2 text-left text-sm font-bold">
            {{ t('status') }}
          </th>
          <th class="w-12" />
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
          <td class="px-4 py-3">
            <StatusBadge :status="row.active" />
          </td>
          <td class="px-4 py-3 text-right">
            <Button variant="ghost" size="icon-xs" @click="openEditSheet(row)">
              <LucideSquarePen class="size-4" />
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="text-muted-foreground px-4 py-6 text-center text-sm">
    {{ t('no_entity', { entityName: 'language' }, 2) }}
  </div>

  <!-- Add language dialog -->
  <Dialog v-model:open="addDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('channels.add_language') }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('channels.add_language') }}
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
          {{ t('continue') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Edit language sheet -->
  <Sheet :open="editSheetOpen" @update:open="editSheetOpen = $event">
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{{ t('channels.edit_language') }}</SheetTitle>
      </SheetHeader>
      <SheetBody v-if="editingLanguage" class="flex flex-col gap-6">
        <ChannelLanguageIcon
          :language-id="editingLanguage._id"
          :name="editingLanguage.name"
          size="md"
        />
        <div class="flex items-center justify-between">
          <Label>{{ t('status') }}</Label>
          <Switch v-model:checked="editActive" />
        </div>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="editSheetOpen = false">
          {{ t('cancel') }}
        </Button>
        <Button @click="confirmEdit">
          {{ t('continue') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
