<script setup lang="ts">
import type { LinkedAsset } from '#shared/types';
import {
  assetDownloadHref,
  assetViewHref,
  orderLinkTarget,
} from '#shared/utils/asset';
import { chunkIds } from '#shared/utils/bulk';
import { formatFileSize } from '#shared/utils/file';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * The files linked to one order (`orderfile` links), read from
 * `GET media/targets/orderfile/{id}/assets`. Each file opens or downloads
 * through media's signed-URL routes, private ones included, and can be
 * unlinked. **Add files** opens the asset picker (its quick upload covers a
 * file that isn't in the library yet) and links the new picks. The customer
 * who placed the order can download these files through the Merchant API.
 *
 * Not a `PanelEdit`: every action writes at once, so there is nothing unsaved.
 */
const props = defineProps<{
  /** The order's numeric id — the link target. `null` while closed. */
  orderId: string | null;
}>();
const open = defineModel<boolean>('open', { default: false });

const { t } = useI18n();
const { toast } = useToast();
const { assetApi } = useGeinsRepository();
const { open: openPicker } = useAssetPicker();
const { formatDate } = useDate();
const { geinsLogError } = useGeinsLog('components/OrderFilesPanel.vue');

// One cache entry for every order (a reactive key would seed the new order's
// entry with the last one's files), so track whose files it holds: the
// skeleton shows until this order's land, never the previous order's rows.
const {
  data: files,
  pending,
  error,
  refresh,
} = useAsyncData<LinkedAsset[]>(
  'order-files',
  () =>
    props.orderId
      ? assetApi.target('orderfile', props.orderId).list()
      : Promise.resolve([]),
  { default: () => [], immediate: false },
);
const loadedFor = ref<string | null>(null);
const isCurrent = computed(() => loadedFor.value === props.orderId);

async function load() {
  const orderId = props.orderId;
  if (!orderId) return;
  await refresh();
  if (props.orderId === orderId && !error.value) loadedFor.value = orderId;
}

// Read on every open: files may have been linked from the library meanwhile.
watch(
  [open, () => props.orderId],
  ([isOpen]) => {
    if (isOpen) load();
  },
  { immediate: true },
);

const adding = ref(false);

async function addFiles() {
  const orderId = props.orderId;
  if (!orderId || adding.value) return;
  const linkedIds = (files.value ?? []).map((file) => file._id);
  const picked = await openPicker({
    multiple: true,
    preselectedIds: linkedIds,
    title: t('orders.add_files_to_order', { number: orderId }),
  });
  const linked = new Set(linkedIds);
  const newIds = picked
    .map((asset) => asset._id)
    .filter((id) => !linked.has(id));
  if (!newIds.length) return;
  adding.value = true;
  try {
    // A bulk-link call takes at most 100 assets.
    for (const ids of chunkIds(newIds))
      await assetApi.bulkLink(ids, [orderLinkTarget(orderId)]);
    toast({
      title: t('entity_added', { entityKey: 'file' }, newIds.length),
    });
  } catch (err) {
    // The global API error toast already told the user; linking only adds,
    // so a partial run is safe to repeat.
    geinsLogError('addFiles', getErrorMessage(err));
  } finally {
    adding.value = false;
    await Promise.all([refresh(), refreshNuxtData('asset-links')]);
  }
}

const pendingRemove = ref<LinkedAsset | null>(null);
const removeOpen = ref(false);
const removing = ref(false);

function requestRemove(file: LinkedAsset) {
  pendingRemove.value = file;
  removeOpen.value = true;
}

async function confirmRemove() {
  const file = pendingRemove.value;
  const orderId = props.orderId;
  if (!file || !orderId) return;
  removing.value = true;
  try {
    await assetApi.removeLink(file._id, 'orderfile', orderId);
    toast({ title: t('entity_removed', { entityKey: 'link' }) });
    removeOpen.value = false;
  } catch (err) {
    geinsLogError('removeLink', getErrorMessage(err));
  } finally {
    removing.value = false;
    await Promise.all([refresh(), refreshNuxtData('asset-links')]);
  }
}

const fileMeta = (file: LinkedAsset) =>
  [
    formatFileSize(file.sizeBytes),
    t('orders.file_linked_on', {
      date: formatDate(file.linkedAt, { dateStyle: 'medium' }),
    }),
  ].join(' · ');
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent width="narrow">
      <SheetHeader>
        <SheetTitle>
          {{ $t('orders.order_title', { number: orderId ?? '' }) }}
        </SheetTitle>
        <SheetDescription>
          {{ $t('orders.order_files_description') }}
        </SheetDescription>
      </SheetHeader>

      <SheetBody class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-sm font-semibold">{{ $t('file', 2) }}</h3>
          <ButtonIcon
            icon="Plus"
            size="sm"
            variant="secondary"
            :disabled="adding || !orderId || !isCurrent"
            data-test="order-files-add"
            @click="addFiles"
          >
            {{ $t('add_entity', { entityKey: 'file' }, 2) }}
          </ButtonIcon>
        </div>

        <div v-if="!isCurrent && !error" class="space-y-2">
          <Skeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-lg" />
        </div>

        <Card v-else-if="error">
          <CardContent class="p-0">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="destructive">
                  <LucideTriangleAlert />
                </EmptyMedia>
                <EmptyTitle>
                  {{ $t('error_loading_entity', { entityKey: 'file' }, 2) }}
                </EmptyTitle>
                <EmptyDescription>{{ $t('error_try_again') }}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <ButtonIcon icon="retry" variant="secondary" @click="load()">
                  {{ $t('retry') }}
                </ButtonIcon>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>

        <Card v-else-if="!files?.length">
          <CardContent class="p-0">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LucidePaperclip />
                </EmptyMedia>
                <EmptyTitle>
                  {{ $t('no_entity', { entityKey: 'file' }, 2) }}
                </EmptyTitle>
                <EmptyDescription>
                  {{ $t('orders.order_files_empty') }}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>

        <TooltipProvider v-else :delay-duration="100">
          <ul
            class="space-y-2 transition-opacity"
            :class="pending && 'opacity-60'"
            :aria-busy="pending || undefined"
            data-test="order-files-list"
          >
            <li
              v-for="file in files"
              :key="file._id"
              class="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <AssetThumbnail :type="file.type" :url="null" size="row" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ file.name }}</p>
                <p class="text-muted-foreground truncate text-xs">
                  {{ fileMeta(file) }}
                </p>
              </div>
              <Badge
                v-if="file.private"
                variant="secondary"
                size="sm"
                class="gap-1"
              >
                <LucideLock class="size-3" aria-hidden="true" />
                {{ $t('asset_library.private') }}
              </Badge>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button as-child variant="ghost" size="icon" class="size-7">
                    <a
                      :href="assetViewHref(file._id)"
                      target="_blank"
                      rel="noopener"
                      :aria-label="$t('asset_library.open_file')"
                    >
                      <LucideExternalLink class="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {{ $t('asset_library.open_file') }}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button as-child variant="ghost" size="icon" class="size-7">
                    <a
                      :href="assetDownloadHref(file._id)"
                      :download="file.name"
                      :aria-label="$t('download')"
                    >
                      <LucideDownload class="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{{ $t('download') }}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-7"
                    :aria-label="$t('remove_entity', { entityKey: 'link' })"
                    data-test="order-files-remove"
                    @click="requestRemove(file)"
                  >
                    <LucideX class="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {{ $t('remove_entity', { entityKey: 'link' }) }}
                </TooltipContent>
              </Tooltip>
            </li>
          </ul>
        </TooltipProvider>
      </SheetBody>

      <DialogDelete
        v-model:open="removeOpen"
        entity-key="link"
        :loading="removing"
        :description="
          $t('orders.remove_order_file_description', {
            name: pendingRemove?.name ?? '',
          })
        "
        @confirm="confirmRemove"
      />
    </SheetContent>
  </Sheet>
</template>
