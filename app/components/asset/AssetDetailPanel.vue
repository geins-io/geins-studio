<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import type { Asset, AssetUpdate } from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { formatFileSize } from '#shared/utils/file';

/**
 * Asset detail/edit panel — the standard slide-in edit panel (PanelEdit) for a
 * single asset. Editable metadata (name, folder, description, tags, channels)
 * plus read-only info. Alt text (translation panel), actions, and replace are
 * separate. Opened from the library card/row via `v-model:open` + `:asset`.
 */
const props = defineProps<{ asset: Asset | null }>();
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ updated: [] }>();

const { t } = useI18n();
const { assetApi } = useGeinsRepository();
const { formatDate } = useDate();
const { folders, refresh: refreshFolders } = useFolders();
const { geinsLogError } = useGeinsLog('components/AssetDetailPanel.vue');

const entityKey = ENTITIES.asset.key;
const NO_FOLDER = '__none__';

const loading = ref(false);
const creatingFolder = ref(false);
const newFolderName = ref('');

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, t('form.required')),
    folderId: z.string().nullable(),
    description: z.string(),
    tags: z.array(z.string()),
    channels: z.array(z.string()),
  }),
);
const form = useForm({ validationSchema: formSchema });
const isDirty = computed(() => form.meta.value.dirty);

watch(open, (value) => {
  if (value && props.asset) {
    creatingFolder.value = false;
    newFolderName.value = '';
    form.resetForm({
      values: {
        name: props.asset.name,
        folderId: props.asset.folderId,
        description: props.asset.description ?? '',
        tags: [...props.asset.tags],
        channels: [...props.asset.channels],
      },
    });
  }
});

async function createFolder() {
  const name = newFolderName.value.trim();
  if (!name) {
    creatingFolder.value = false;
    return;
  }
  try {
    const folder = await assetApi.folder.create({
      name,
      parentId: null,
      sortOrder: 0,
    });
    await refreshFolders();
    form.setFieldValue('folderId', folder._id);
  } catch (error) {
    geinsLogError('createFolder', getErrorMessage(error));
  }
  creatingFolder.value = false;
  newFolderName.value = '';
}

async function handleSave() {
  if (!props.asset) return;
  const result = await form.validate();
  if (!result.valid) return;
  loading.value = true;
  try {
    const payload: AssetUpdate = {
      name: form.values.name,
      folderId: form.values.folderId ?? null,
      description: form.values.description || null,
      tags: form.values.tags ?? [],
      channels: form.values.channels ?? [],
    };
    await assetApi.update(props.asset._id, payload);
    await refreshNuxtData('asset-library-list');
    emit('updated');
    open.value = false;
  } catch (error) {
    geinsLogError('updateAsset', getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <PanelEdit
    v-model:open="open"
    :title="asset?.name ?? $t(entityKey, 1)"
    :entity-key="entityKey"
    :dirty="isDirty"
    :loading="loading"
    :save-disabled="!isDirty"
    @save="handleSave"
  >
    <template v-if="asset">
      <div class="mb-6">
        <AssetThumbnail
          :type="asset.type"
          :thumb-url="asset.thumbUrl"
          :alt="asset.name"
          size="card"
        />
      </div>

      <form @submit.prevent>
        <FormGridWrap>
          <FormGrid design="1">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>{{ $t('name', 1) }}</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="folderId">
              <FormItem>
                <FormLabel :optional="true">{{ $t('folder', 1) }}</FormLabel>
                <div v-if="creatingFolder" class="flex gap-2">
                  <Input
                    v-model="newFolderName"
                    :placeholder="$t('folder_name')"
                    @keydown.enter.prevent="createFolder"
                    @keydown.esc.prevent="creatingFolder = false"
                  />
                  <Button variant="secondary" size="lg" @click="createFolder">
                    {{ $t('save') }}
                  </Button>
                </div>
                <div v-else class="flex gap-2">
                  <Select
                    :model-value="value ?? NO_FOLDER"
                    @update:model-value="
                      (v) => handleChange(v === NO_FOLDER ? null : v)
                    "
                  >
                    <SelectTrigger class="flex-1">
                      <SelectValue :placeholder="$t('no_folder')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="NO_FOLDER">
                        {{ $t('no_folder') }}
                      </SelectItem>
                      <SelectItem
                        v-for="folder in folders"
                        :key="folder._id"
                        :value="folder._id"
                      >
                        {{ folder.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <ButtonIcon
                    icon="new"
                    variant="outline"
                    size="lg"
                    @click="creatingFolder = true"
                  >
                    {{ $t('new') }}
                  </ButtonIcon>
                </div>
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel :optional="true">{{ $t('description') }}</FormLabel>
                <FormControl>
                  <Textarea v-bind="componentField" />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="tags">
              <FormItem>
                <FormLabel :optional="true">{{ $t('tag', 2) }}</FormLabel>
                <FormControl>
                  <TagsInput
                    :model-value="(componentField.modelValue as string[]) || []"
                    class="min-h-10 flex-wrap"
                    @update:model-value="componentField['onUpdate:modelValue']"
                  >
                    <TagsInputItem
                      v-for="tag in (componentField.modelValue as string[]) ||
                      []"
                      :key="tag"
                      :value="tag"
                    >
                      <TagsInputItemText />
                      <TagsInputItemDelete />
                    </TagsInputItem>
                    <TagsInputInput :placeholder="$t('add_tag')" />
                  </TagsInput>
                </FormControl>
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="channels">
              <FormItem>
                <FormLabel :optional="true">{{ $t('channel', 2) }}</FormLabel>
                <FormControl>
                  <FormInputChannels
                    :model-value="value"
                    @update:model-value="handleChange"
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </FormGrid>
        </FormGridWrap>
      </form>

      <dl class="mt-6 space-y-2 border-t pt-4 text-sm">
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('type') }}</dt>
          <dd><AssetTypeBadge :type="asset.type" /></dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('size') }}</dt>
          <dd>{{ formatFileSize(asset.sizeBytes) }}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('created') }}</dt>
          <dd>{{ formatDate(asset.createdAt, { dateStyle: 'medium' }) }}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('modified') }}</dt>
          <dd>{{ formatDate(asset.updatedAt, { dateStyle: 'medium' }) }}</dd>
        </div>
        <div v-if="asset.createdBy" class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('created_by') }}</dt>
          <dd>{{ asset.createdBy }}</dd>
        </div>
      </dl>
    </template>
  </PanelEdit>
</template>
