<script setup lang="ts">
import { useFieldValue } from 'vee-validate';
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
    mailFromEmail?: string;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  'mail-saved': [];
  'update:mail-type-active': [payload: { _id: string; active: boolean }];
}>();

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

// Read the master-disable flag directly from the parent VeeValidate form
// (lifted to `mail.disabled` in STU-125). The field is registered on the
// parent form scope and resolved by name.
const mailDisabled = useFieldValue<boolean>('mail.disabled');

// When the master "disable all transaction emails" toggle flips on while the
// user is on a now-disabled sub-tab, snap them back to General.
watch(mailDisabled, (disabled) => {
  if (disabled && activeTab.value !== 'general') {
    activeTab.value = 'general';
  }
});

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
        <TabsTrigger value="mail-content" :disabled="mailDisabled ?? false">
          {{ t('channels.mail_content') }}
        </TabsTrigger>
        <TabsTrigger value="layout" :disabled="mailDisabled ?? false">
          {{ t('channels.mail_layout') }}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="general"
        force-mount
        class="data-[state=inactive]:hidden"
      >
        <ChannelMailGeneralTab
          :storefront-url="storefrontUrl"
          :from-email="mailFromEmail"
        />
      </TabsContent>
      <TabsContent value="mail-content">
        <ChannelMailContentTab
          :mail-types="mailTypes"
          :loading="loading"
          @edit="handleEditMailType"
          @update:active="emit('update:mail-type-active', $event)"
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
