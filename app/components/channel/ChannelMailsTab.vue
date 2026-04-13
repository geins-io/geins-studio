<script setup lang="ts">
import type { ChannelMailSettings, ChannelMailType } from '#shared/types';

withDefaults(
  defineProps<{
    mailTypes: ChannelMailType[];
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  'edit-mail-type': [mailType: ChannelMailType];
}>();

const generalFields = defineModel<Partial<ChannelMailSettings>>(
  'generalFields',
  { required: true },
);

const { t } = useI18n();
</script>

<template>
  <ContentEditCard :title="t('channels.tab_mails')">
    <Tabs default-value="mail-content">
      <TabsList>
        <TabsTrigger value="mail-content">
          {{ t('channels.mail_content') }}
        </TabsTrigger>
        <TabsTrigger value="general">
          {{ t('channels.mail_general') }}
        </TabsTrigger>
        <TabsTrigger value="layout">
          {{ t('channels.mail_layout') }}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="mail-content">
        <ChannelMailContentTab
          :mail-types="mailTypes"
          :loading="loading"
          @edit="emit('edit-mail-type', $event)"
        />
      </TabsContent>
      <TabsContent value="general">
        <ChannelMailGeneralTab v-model="generalFields" />
      </TabsContent>
      <TabsContent value="layout">
        <!-- filled by STU-118 -->
      </TabsContent>
    </Tabs>
  </ContentEditCard>
</template>
