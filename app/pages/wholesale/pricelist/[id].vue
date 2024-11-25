<script setup lang="ts">
import { useRoute } from 'vue-router';

const { t } = useI18n();

const route = useRoute();
const entityName = 'pricelist';
const createMode = ref(route.params.id === 'new');
const title = computed(() =>
  createMode.value
    ? t('new_entity', { entityName })
    : t('edit_entity', { entityName }),
);
const currentStep = ref(1);
</script>

<template>
  <ContentEdit>
    <template #header>
      <ContentHeader :title="title">
        <ContentActionBar>
          <ButtonNew
            v-if="!createMode"
            variant="secondary"
            href="/wholesale/pricelist/new"
          >
            {{ $t('new') }}
          </ButtonNew>
          <ButtonCopy v-if="!createMode" variant="secondary">{{
            $t('copy')
          }}</ButtonCopy>
          <Button v-if="createMode" variant="secondary">Cancel</Button>
          <ButtonSave>{{ $t('save_entity', { entityName }) }}</ButtonSave>
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentTabs class="mt-5" />
        </template>
      </ContentHeader>
    </template>
    <ContentEditMain>
      <ContentCreateStep :step="1" :current-step="currentStep" title="General">
        Edit general
      </ContentCreateStep>
      <ContentCreateStep :step="2" :current-step="1" title="Details">
        Edit details
      </ContentCreateStep>
      <template #sidebar>
        <Card class="p-5">Details</Card>
      </template>
    </ContentEditMain>
  </ContentEdit>
</template>
