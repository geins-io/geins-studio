<script setup lang="ts">
import type { ChannelMailSettings, ChannelMailType } from '#shared/types';

withDefaults(
  defineProps<{
    mailSettings: ChannelMailSettings | null;
    mailTypes: ChannelMailType[];
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const { t } = useI18n();
</script>

<template>
  <ContentEditCard :title="t('channels.tab_mails')">
    <template #header-action>
      <Button variant="ghost" size="icon" disabled>
        <LucideSettings class="size-4" />
      </Button>
    </template>
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
        <!-- filled by STU-112 -->
      </TabsContent>
      <TabsContent value="general">
        <!-- filled by STU-119 -->
      </TabsContent>
      <TabsContent value="layout">
        <!-- filled by STU-118 -->
      </TabsContent>
    </Tabs>
  </ContentEditCard>
</template>
