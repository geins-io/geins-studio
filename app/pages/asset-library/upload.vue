<script setup lang="ts">
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

      <!-- Step 2 — manage: header + split panel in a card that fills the middle. -->
      <Card v-if="currentStep === 2" class="flex min-h-0 flex-1 flex-col">
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
              <div class="text-muted-foreground py-12 text-center text-sm">
                {{ $t('asset_library.wizard_step_review') }}
              </div>
            </template>
          </CardContent>
        </Card>
      </div>

      <!-- Pinned at the bottom; thin bar with even top/bottom padding. -->
      <div class="flex shrink-0 items-center justify-between border-t py-4">
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
          <ButtonIcon v-if="isLastStep" icon="upload" :disabled="!files.length">
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
