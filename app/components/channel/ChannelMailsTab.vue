<script setup lang="ts">
import type {
  ChannelMailSettings,
  ChannelMailType,
  Language,
} from '#shared/types';
import type { MailLayoutStagedFiles } from './ChannelMailLayoutTab.vue';

withDefaults(
  defineProps<{
    mailTypes: ChannelMailType[];
    loading?: boolean;
    channelId: string;
    languages: Language[];
    defaultLanguage: string;
    storefrontUrl?: string;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  'mail-saved': [];
}>();

const generalFields = defineModel<Partial<ChannelMailSettings>>(
  'generalFields',
  { required: true },
);
const layoutFields = defineModel<Partial<ChannelMailSettings>>('layoutFields', {
  required: true,
});
const layoutFiles = defineModel<MailLayoutStagedFiles>('layoutFiles', {
  default: () => ({}),
});

const { t } = useI18n();

const sheetOpen = ref(false);
const activeMailType = ref<ChannelMailType | null>(null);
const activeTab = ref<'general' | 'mail-content' | 'layout'>('general');

// When the master "disable all transaction emails" toggle flips on while the
// user is on a now-disabled sub-tab, snap them back to General.
watch(
  () => generalFields.value?.disabled,
  (disabled) => {
    if (disabled && activeTab.value !== 'general') {
      activeTab.value = 'general';
    }
  },
);

function handleEditMailType(mailType: ChannelMailType) {
  activeMailType.value = mailType;
  sheetOpen.value = true;
}

function handleSaved() {
  emit('mail-saved');
}
</script>

<template>
  <ContentEditCard :title="t('channels.tab_mails')">
    <Tabs v-model="activeTab">
      <TabsList class="mb-2">
        <TabsTrigger value="general">
          {{ t('channels.mail_general') }}
        </TabsTrigger>
        <TabsTrigger
          value="mail-content"
          :disabled="generalFields?.disabled ?? false"
        >
          {{ t('channels.mail_content') }}
        </TabsTrigger>
        <TabsTrigger
          value="layout"
          :disabled="generalFields?.disabled ?? false"
        >
          {{ t('channels.mail_layout') }}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <ChannelMailGeneralTab
          v-model="generalFields"
          :storefront-url="storefrontUrl"
        />
      </TabsContent>
      <TabsContent value="mail-content">
        <ChannelMailContentTab
          :mail-types="mailTypes"
          :loading="loading"
          @edit="handleEditMailType"
        />
      </TabsContent>

      <TabsContent value="layout">
        <ChannelMailLayoutTab
          v-model="layoutFields"
          v-model:staged-files="layoutFiles"
        />
      </TabsContent>
    </Tabs>
  </ContentEditCard>

  <ChannelMailConfigSheet
    v-model:open="sheetOpen"
    :channel-id="channelId"
    :mail-type="activeMailType"
    :languages="languages"
    :default-language="defaultLanguage"
    @saved="handleSaved"
  />
</template>
