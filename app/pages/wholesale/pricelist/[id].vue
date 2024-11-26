<script setup lang="ts">
import { useRoute } from 'vue-router';

// EDIT PAGE OPTIONS
const tabs = ['Main'];

// GLOBALS
const { t } = useI18n();
const route = useRoute();
const { newEntityUrlAlias, getEntityName, getNewEntityUrl } = useEntity();

// SETTINGS
const entityName = getEntityName(route.fullPath);
const newEntityUrl = getNewEntityUrl(route.fullPath);
const currentTab = ref(0);

// COMPUTED GLOBALS
const createMode = ref(route.params.id === newEntityUrlAlias);
const title = computed(() =>
  createMode.value
    ? t('new_entity', { entityName })
    : t('edit_entity', { entityName }),
);
const currentStep = ref(1);
</script>

<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="title">
        <ContentActionBar>
          <ButtonNew
            v-if="!createMode"
            variant="secondary"
            :href="newEntityUrl"
          >
            {{ $t('new') }}
          </ButtonNew>
          <ButtonCopy v-if="!createMode" variant="secondary"
            >{{ $t('copy') }}
          </ButtonCopy>
          <Button v-if="createMode" variant="secondary">Cancel</Button>
          <ButtonSave>{{ $t('save_entity', { entityName }) }}</ButtonSave>
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentTabs
            v-model:current-tab="currentTab"
            :tabs="tabs"
            class="mt-5"
          />
        </template>
      </ContentHeader>
    </template>
    <ContentEditMain v-if="currentTab === 0">
      <ContentEditCard
        :create-mode="createMode"
        :step="1"
        :current-step="currentStep"
        title="General"
      >
        Edit general
      </ContentEditCard>
      <ContentEditCard
        :create-mode="createMode"
        :step="2"
        :current-step="1"
        title="Details"
      >
        Edit details
      </ContentEditCard>
      <template #sidebar>
        <Card class="p-5">Details</Card>
      </template>
    </ContentEditMain>
  </ContentEditWrap>
</template>
