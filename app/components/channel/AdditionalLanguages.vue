<script setup lang="ts">
import type {
  ChannelLanguageAssignment,
  FlagText,
  Language,
} from '#shared/types';
import type { Row } from '@tanstack/vue-table';

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const emptyIcon = resolveIcon('Languages') ?? undefined;

const props = defineProps<{
  allLanguages: Language[];
  channelLanguages: ChannelLanguageAssignment[];
  defaultLanguageId: string;
}>();

const emit = defineEmits<{
  add: [languages: ChannelLanguageAssignment[]];
  update: [language: ChannelLanguageAssignment];
  remove: [languageId: string];
}>();

// Additional languages (everything except the default)
const additionalLanguages = computed(() => {
  return props.channelLanguages.filter((l) => l._id !== props.defaultLanguageId);
});

interface LanguageRow {
  _id: string;
  language: FlagText;
  active: boolean;
}

// Table rows enriched with name from allLanguages
const tableRows = computed<LanguageRow[]>(() => {
  return additionalLanguages.value.map((lang) => {
    const full = props.allLanguages.find((l) => l._id === lang._id);
    return {
      _id: lang._id,
      language: {
        code: languageToCountryCode(lang._id),
        label: full?.name || lang._id,
      },
      active: lang.active,
    };
  });
});

// Remove language confirmation
const languagePendingRemoval = ref<string | null>(null);
const removeDialogOpen = ref(false);

const openRemoveDialog = (languageId: string) => {
  languagePendingRemoval.value = languageId;
  removeDialogOpen.value = true;
};

const confirmRemove = () => {
  if (languagePendingRemoval.value) {
    emit('remove', languagePendingRemoval.value);
  }
  languagePendingRemoval.value = null;
  removeDialogOpen.value = false;
};

const { getColumns, orderAndFilterColumns, addActionsColumn } =
  useColumns<LanguageRow>();

const columns = computed(() => {
  let cols = getColumns(tableRows.value, {
    excludeColumns: ['_id'],
    columnTypes: {
      language: 'flag',
      active: 'switch',
    },
    columnTitles: {
      language: t('language'),
      active: t('active'),
    },
    columnCellProps: {
      active: {
        onChange: (row: Row<LanguageRow>) => (value: boolean) => {
          emit('update', { _id: row.original._id, active: value });
        },
      },
    },
    sortable: false,
  });
  cols = orderAndFilterColumns(cols, ['language', 'active']);
  cols = addActionsColumn(
    cols,
    {
      onDelete: (item: LanguageRow) => openRemoveDialog(item._id),
    },
    'delete',
  );
  return cols;
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
  <TableView
    :columns="columns"
    :data="tableRows"
    :mode="TableMode.Minimal"
    entity-name="language"
    :empty-text="t('channels.additional_languages_empty')"
    :empty-icon="emptyIcon"
  />

  <!-- Remove language confirmation dialog -->
  <AlertDialog v-model:open="removeDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('channels.remove_language') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('channels.remove_language_description') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('cancel') }}</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="confirmRemove"
        >
          {{ t('remove') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

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
