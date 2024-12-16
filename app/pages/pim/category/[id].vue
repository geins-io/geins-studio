<script setup lang="ts">
import { useRoute } from 'vue-router';

// EDIT PAGE OPTIONS
const tabs = ['Main'];

// GLOBALS
const { t } = useI18n();
const route = useRoute();
const { newEntityUrlAlias, getEntityName, getNewEntityUrl } = useEntity(
  route.fullPath,
);
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
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
          <ButtonIcon
            v-if="!createMode"
            icon="new"
            variant="secondary"
            :href="newEntityUrl"
          >
            {{ $t('new') }}
          </ButtonIcon>
          <ButtonIcon v-if="!createMode" icon="copy" variant="secondary"
            >{{ $t('copy') }}
          </ButtonIcon>
          <Button v-if="createMode" variant="secondary">Cancel</Button>
          <ButtonIcon icon="save">{{
            $t('save_entity', { entityName })
          }}</ButtonIcon>
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
      <ContentCard>
        <Selector mode="simple">
          <template #selection>
            <ButtonIcon icon="new">Add</ButtonIcon>
          </template>
          <template #list>
            <Select>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </Select>
          </template>
        </Selector>
      </ContentCard>
      <template #sidebar>
        <Card class="p-5">Details</Card>
      </template>
    </ContentEditMain>
  </ContentEditWrap>
</template>
