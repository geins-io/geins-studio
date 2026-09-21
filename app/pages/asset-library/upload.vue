<script setup lang="ts">
import type {
  AssetLocalizations,
  Localized,
  LocalizedText,
  UploadRejectionCode,
} from '#shared/types';
import { uploadRejectionMessageKey } from '#shared/utils/asset';
import { entityListUrl } from '#shared/utils/entities';
import { formatFileSize } from '#shared/utils/file';
import { Card, CardContent } from '@/components/ui/card';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import {
  uploadWizardKey,
  useUploadWizard,
} from '@/composables/useUploadWizard';

// App-shell layout (overflow-hidden): the stepper is pinned at the top and the
// footer nav at the bottom; only the step content between them scrolls.
definePageMeta({ pageType: 'list' });

const { t } = useI18n();
const breadcrumbsStore = useBreadcrumbsStore();

watch(
  () => t('asset_library.upload_wizard'),
  (title) => breadcrumbsStore.setCurrentTitle(title, true),
  { immediate: true },
);

// One wizard instance for the page; shared with the step components (B/C/D) via
// inject so they read/write the same files + settings.
const wizard = useUploadWizard();
provide(uploadWizardKey, wizard);
const { files, totalSize, addFiles, removeFiles, clear } = wizard;

const { currentStep, nextStep, previousStep, isFirstStep, isLastStep } =
  useStepManagement(3);

const steps = computed(() => [
  { step: 1, title: t('asset_library.wizard_step_files') },
  { step: 2, title: t('asset_library.wizard_step_manage') },
  { step: 3, title: t('asset_library.wizard_step_review') },
]);

// Step 1 needs at least one file before advancing; later steps have no gate yet.
const canProceed = computed(
  () => currentStep.value !== 1 || files.value.length > 0,
);

const { assetApi } = useGeinsRepository();
const { geinsLogError } = useGeinsLog('pages/asset-library/upload.vue');
const { currentLanguage } = storeToRefs(useAccountStore());
const { matchOf } = useProductMatch();

const uploading = ref(false);
const done = ref(false);

// Per-file outcome for the result screen. `clientRef` is the WizardFile id we
// send as the ticket clientRef, so it maps each result back to its source file.
interface OutcomeRow {
  name: string;
  status: 'completed' | 'rejected';
  code?: UploadRejectionCode;
}
const outcomes = ref<OutcomeRow[]>([]);
const completedCount = computed(
  () => outcomes.value.filter((o) => o.status === 'completed').length,
);
const rejectedOutcomes = computed(() =>
  outcomes.value.filter((o) => o.status === 'rejected'),
);

// Wizard alt text (per-locale) + description (single, default-language) → the
// wire `localizations` shape, dropping blanks. Rides the ticket claim, which
// applies it when the upload completes.
function buildLocalizations(
  description: string | undefined,
  altText: LocalizedText,
): Localized<AssetLocalizations> {
  const out: Localized<AssetLocalizations> = {};
  for (const [loc, text] of Object.entries(altText ?? {})) {
    const trimmed = text?.trim();
    if (trimmed) (out[loc] ??= {}).altText = trimmed;
  }
  const desc = description?.trim();
  if (desc) (out[currentLanguage.value] ??= {}).description = desc;
  return out;
}

async function submit() {
  if (!files.value.length) return;
  uploading.value = true;

  // Snapshot the display name per clientRef before the async work, so outcomes
  // resolve even if the file list changes underneath.
  const nameByRef = new Map(
    files.value.map((wf) => [
      wf.id,
      wizard.settingsOf(wf.id).name || wf.file.name,
    ]),
  );
  const items = files.value.map((wf) => {
    const s = wizard.settingsOf(wf.id);
    // Metadata + the matched product ride the claim, so a completed upload is
    // already fully described — no second write to fail after the bytes land.
    const product = wizard.linkProducts.value ? matchOf(wf.file) : null;
    return {
      file: wf.file,
      clientRef: wf.id,
      folderId: s.folderId ?? null,
      name: s.name || wf.file.name,
      localizations: buildLocalizations(s.description, s.altText ?? {}),
      ...(product ? { productIds: [product._id] } : {}),
    };
  });

  try {
    const results = await assetApi.uploadViaTickets(items);
    await refreshNuxtData('asset-library-list');
    outcomes.value = results.map((r) => ({
      name: nameByRef.get(r.clientRef) ?? r.clientRef,
      status: r.status,
      code: r.status === 'rejected' ? r.code : undefined,
    }));
    done.value = true;
  } catch (error) {
    // A hard failure (e.g. a ticket claim threw) flows to the global error
    // toast; stay on the review step so the user can retry.
    geinsLogError('submit', getErrorMessage(error));
  } finally {
    uploading.value = false;
  }
}

function leave() {
  navigateTo(entityListUrl('asset'));
}
</script>

<template>
  <div class="mx-auto flex min-h-0 w-full max-w-[80rem] flex-1 flex-col">
    <ContentHeader
      :title="$t('asset_library.upload_wizard')"
      :description="$t('asset_library.upload_wizard_description')"
    />

    <div class="-mb-12 flex min-h-0 flex-1 flex-col @2xl:-mb-14">
      <!-- Pinned at the top; the step content below it scrolls. -->
      <div class="shrink-0 pb-6">
        <Stepper v-model="currentStep" class="w-full items-start gap-0">
          <template v-for="(s, i) in steps" :key="s.step">
            <StepperItem
              v-slot="{ state }"
              :step="s.step"
              class="shrink-0 flex-col items-center"
            >
              <StepperTrigger class="flex-col gap-1.5">
                <StepperIndicator>
                  <LucideCheck v-if="state === 'completed'" class="size-3.5" />
                  <template v-else>{{ s.step }}</template>
                </StepperIndicator>
                <StepperTitle
                  class="group-data-[state=active]:text-foreground group-data-[state=completed]:text-muted-foreground group-data-[state=inactive]:text-muted-foreground/60 text-xs font-medium"
                >
                  {{ s.title }}
                </StepperTitle>
              </StepperTrigger>
            </StepperItem>
            <div
              v-if="i < steps.length - 1"
              class="mx-3 mt-[1.0625rem] h-0.5 flex-1 rounded-full"
              :class="currentStep > s.step ? 'bg-primary' : 'bg-muted'"
            />
          </template>
        </Stepper>
      </div>

      <!-- Uploading -->
      <Card v-if="uploading">
        <CardContent class="flex flex-col items-center gap-3 py-16 text-center">
          <AppLoader
            :text="
              $t(
                'asset_library.uploading_files',
                { count: files.length },
                files.length,
              )
            "
          />
          <p class="text-muted-foreground text-sm">
            {{ $t('asset_library.uploading_wait') }}
          </p>
        </CardContent>
      </Card>

      <!-- Result — completed count, plus any per-file rejections -->
      <Card v-else-if="done">
        <CardContent class="flex flex-col items-center gap-5 py-16 text-center">
          <div
            class="flex size-16 items-center justify-center rounded-full"
            :class="
              rejectedOutcomes.length
                ? 'bg-warning/10 text-warning'
                : 'bg-positive/10 text-positive'
            "
          >
            <LucideTriangleAlert
              v-if="rejectedOutcomes.length"
              class="size-8"
            />
            <LucideCircleCheck v-else class="size-8" />
          </div>
          <div>
            <p class="text-xl font-semibold">
              {{
                completedCount
                  ? $t(
                      'asset_library.uploaded_success',
                      { count: completedCount },
                      completedCount,
                    )
                  : $t('asset_library.upload_none_succeeded')
              }}
            </p>
            <p class="text-muted-foreground mt-1 text-sm">
              {{
                rejectedOutcomes.length
                  ? $t(
                      'asset_library.upload_failed_count',
                      { count: rejectedOutcomes.length },
                      rejectedOutcomes.length,
                    )
                  : $t('asset_library.uploaded_success_hint')
              }}
            </p>
          </div>

          <!-- Per-file rejection reasons (friendly copy by code). -->
          <div
            v-if="rejectedOutcomes.length"
            class="w-full max-w-md space-y-1.5 text-left"
          >
            <div
              v-for="(row, i) in rejectedOutcomes"
              :key="i"
              class="bg-muted/40 flex items-start gap-2 rounded-md px-3 py-2 text-sm"
            >
              <LucideFileX
                class="text-muted-foreground mt-0.5 size-4 shrink-0"
              />
              <div class="min-w-0">
                <p class="truncate font-medium">{{ row.name }}</p>
                <p class="text-muted-foreground text-xs">
                  {{ $t(uploadRejectionMessageKey(row.code!)) }}
                </p>
              </div>
            </div>
          </div>

          <Button @click="leave">
            {{ $t('asset_library.go_to_library') }}
          </Button>
        </CardContent>
      </Card>

      <!-- Step 2 — manage: header + split panel in a card that fills the middle. -->
      <Card v-else-if="currentStep === 2" class="flex min-h-0 flex-1 flex-col">
        <CardContent class="flex min-h-0 flex-1 flex-col gap-5 p-6">
          <ContentCardHeader
            size="md"
            :title="$t('asset_library.wizard_step_manage')"
            :description="$t('asset_library.wizard_manage_hint')"
          />
          <AssetWizardManage class="min-h-0 flex-1" />
        </CardContent>
      </Card>

      <!-- Steps 1 & 3 scroll inside a card between the stepper and footer. -->
      <div v-else class="min-h-0 flex-1 overflow-y-auto">
        <Card>
          <CardContent class="space-y-5 p-6">
            <!-- Step 1 — select files -->
            <template v-if="currentStep === 1">
              <ContentCardHeader
                size="md"
                :title="$t('asset_library.wizard_step_files')"
                :description="$t('asset_library.wizard_files_hint')"
              />

              <div class="space-y-4">
                <AssetDropzone
                  :size="files.length ? 'md' : 'lg'"
                  @add="addFiles"
                />

                <div
                  v-if="files.length"
                  class="flex flex-col overflow-hidden rounded-lg border"
                >
                  <div
                    class="flex items-center justify-between border-b px-4 py-3"
                  >
                    <span class="text-sm font-medium">
                      {{
                        $t(
                          'asset_library.files_selected',
                          { count: files.length },
                          files.length,
                        )
                      }}
                      <span class="text-muted-foreground font-normal">
                        · {{ formatFileSize(totalSize) }}
                      </span>
                    </span>
                    <button
                      type="button"
                      class="text-muted-foreground hover:text-foreground text-xs"
                      @click="clear"
                    >
                      {{ $t('asset_library.remove_all') }}
                    </button>
                  </div>
                  <div class="max-h-80 space-y-2 overflow-y-auto p-2">
                    <AssetFileRow
                      v-for="wf in files"
                      :key="wf.id"
                      :file="wf.file"
                      @remove="removeFiles([wf.id])"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- Step 3 — review & upload (STU-321) -->
            <template v-else>
              <ContentCardHeader
                size="md"
                :title="$t('asset_library.wizard_step_review')"
                :description="$t('asset_library.wizard_review_hint')"
              />
              <AssetWizardReview />
            </template>
          </CardContent>
        </Card>
      </div>

      <!-- Pinned at the bottom; thin bar with even top/bottom padding. -->
      <div
        v-if="!uploading && !done"
        class="flex shrink-0 items-center justify-between border-t py-4"
      >
        <ButtonIcon
          v-if="isFirstStep"
          icon="ChevronLeft"
          variant="ghost"
          @click="leave"
        >
          {{ $t('cancel') }}
        </ButtonIcon>
        <ButtonIcon
          v-else
          icon="ChevronLeft"
          variant="outline"
          @click="previousStep"
        >
          {{ $t('back') }}
        </ButtonIcon>

        <div class="flex items-center gap-3">
          <span class="text-muted-foreground text-xs">
            {{
              $t('asset_library.wizard_step_counter', {
                current: currentStep,
                total: steps.length,
              })
            }}
          </span>
          <ButtonIcon
            v-if="isLastStep"
            icon="upload"
            :disabled="!files.length"
            @click="submit"
          >
            {{ $t('upload') }}
          </ButtonIcon>
          <Button v-else :disabled="!canProceed" @click="nextStep">
            {{ $t('next') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
