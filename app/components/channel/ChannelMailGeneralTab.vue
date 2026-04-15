<script setup lang="ts">
import type { ChannelMailSettings } from '#shared/types';

const props = defineProps<{
  storefrontUrl?: string;
}>();

const model = defineModel<Partial<ChannelMailSettings>>({ required: true });

const { t } = useI18n();

const advancedOpen = ref(false);

function update<K extends keyof ChannelMailSettings>(
  key: K,
  value: ChannelMailSettings[K],
) {
  model.value = { ...model.value, [key]: value };
}

const STOREFRONT_URL_PLACEHOLDER = 'https://your-channel.com';

// Strip a trailing `/` from the storefront URL so the addon composes cleanly
// with a slug value that already starts with `/` (the user types it).
const storefrontUrlDisplay = computed(() => {
  const raw = props.storefrontUrl?.trim();
  return (raw || STOREFRONT_URL_PLACEHOLDER).replace(/\/+$/, '');
});
</script>

<template>
  <div class="flex flex-col gap-6 pt-2">
    <!-- Master disable toggle -->
    <Item variant="outline" class="rounded-lg p-3">
      <ItemContent>
        <ItemTitle>{{ t('channels.mail_disabled_toggle') }}</ItemTitle>
        <ItemDescription>
          {{ t('channels.mail_disabled_helper') }}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Switch
          :model-value="model.disabled ?? false"
          @update:model-value="update('disabled', $event)"
        />
      </ItemActions>
    </Item>

    <FormGridWrap>
      <FormGrid design="1+1">
        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_display_name') }}</Label>
          <Input
            :model-value="model.displayName ?? ''"
            @update:model-value="update('displayName', String($event))"
          />
        </div>
        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_from_email') }}</Label>
          <FormInputLocked
            :model-value="model.fromEmailAddress ?? ''"
            type="email"
          />
        </div>
      </FormGrid>

      <FormGrid design="1+1">
        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_login_slug') }}</Label>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText class="text-muted-foreground text-xs">
                {{ storefrontUrlDisplay }}
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              :model-value="model.loginUrl ?? ''"
              @update:model-value="update('loginUrl', String($event))"
            />
          </InputGroup>
        </div>
        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_password_reset_slug') }}</Label>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText class="text-muted-foreground text-xs">
                {{ storefrontUrlDisplay }}
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              :model-value="model.passwordResetUrl ?? ''"
              @update:model-value="update('passwordResetUrl', String($event))"
            />
          </InputGroup>
        </div>
      </FormGrid>

      <FormGrid design="1">
        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_bcc_email') }}</Label>
          <Input
            :model-value="model.orderConfirmationBCCEmail ?? ''"
            type="email"
            @update:model-value="
              update('orderConfirmationBCCEmail', String($event))
            "
          />
          <FormInputDescription>{{ t('form.optional') }}</FormInputDescription>
        </div>
      </FormGrid>
    </FormGridWrap>

    <!-- Advanced collapsible -->
    <ContentSwitch
      v-model:checked="advancedOpen"
      :label="t('channels.mail_advanced')"
    >
      <div class="space-y-4 border-t pt-4">
        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_locale') }}</Label>
          <Input
            :model-value="model.locale ?? ''"
            @update:model-value="update('locale', String($event))"
          />
          <FormInputDescription>
            {{ t('channels.mail_locale_helper') }}
          </FormInputDescription>
        </div>

        <Item variant="outline" class="rounded-lg p-3">
          <ItemContent>
            <ItemTitle>
              {{ t('channels.mail_reply_to_customer') }}
            </ItemTitle>
          </ItemContent>
          <ItemActions>
            <Switch
              :model-value="model.emailReplyToCustomer ?? false"
              @update:model-value="update('emailReplyToCustomer', $event)"
            />
          </ItemActions>
        </Item>

        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_external_source_tag') }}</Label>
          <Input
            :model-value="model.externalSourceVerificationTag ?? ''"
            @update:model-value="
              update('externalSourceVerificationTag', String($event))
            "
          />
        </div>

        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_external_source') }}</Label>
          <Input
            :model-value="model.orderConfirmationExternalSource ?? ''"
            @update:model-value="
              update('orderConfirmationExternalSource', String($event))
            "
          />
        </div>
      </div>
    </ContentSwitch>
  </div>
</template>
