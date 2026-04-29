<script setup lang="ts">
import { useFieldValue } from 'vee-validate';

const props = defineProps<{
  storefrontUrl?: string;
  fromEmail?: string;
}>();

const { t } = useI18n();

const advancedOpen = ref(false);

// Read the current mail.disabled value without registering a second FormField
const mailDisabled = useFieldValue<boolean>('mail.disabled');

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
    <ContentSection
      :title="t('general')"
      :description="t('channels.mail_general_desc')"
    >
      <!-- Master disable toggle -->
      <FormField v-slot="{ value, handleChange }" name="mail.disabled">
        <FormItem>
          <Item variant="outline" class="rounded-lg p-3">
            <ItemContent>
              <ItemTitle>{{ t('channels.mail_disabled_toggle') }}</ItemTitle>
              <ItemDescription>
                {{ t('channels.mail_disabled_helper') }}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <FormControl>
                <Switch
                  :model-value="value ?? false"
                  @update:model-value="handleChange"
                />
              </FormControl>
            </ItemActions>
          </Item>
        </FormItem>
      </FormField>

      <!-- Keep fields mounted via v-show so VeeValidate doesn't clear values
           when the user toggles the master disable flag. -->
      <FormGridWrap v-show="!mailDisabled">
        <FormGrid design="1+1">
          <FormField v-slot="{ componentField }" name="mail.displayName">
            <FormItem>
              <FormLabel>{{ t('channels.mail_display_name') }}</FormLabel>
              <FormControl>
                <Input v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="flex flex-col gap-2">
            <Label>{{ t('channels.mail_from_email') }}</Label>
            <FormInputLocked :model-value="fromEmail ?? ''" type="email" />
          </div>
        </FormGrid>

        <FormGrid design="1">
          <FormField
            v-slot="{ componentField }"
            name="mail.orderConfirmationBCCEmail"
          >
            <FormItem>
              <FormLabel>{{ t('channels.mail_bcc_email') }}</FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="email" />
              </FormControl>
              <FormDescription>
                {{ t('channels.mail_bcc_email_description') }}
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
        </FormGrid>
      </FormGridWrap>

      <!-- Advanced collapsible -->
      <ContentSwitch
        v-show="!mailDisabled"
        v-model:checked="advancedOpen"
        :label="t('channels.mail_advanced')"
        :description="t('channels.mail_advanced_desc')"
      >
        <FormGridWrap>
          <div
            class="grid grid-cols-2 gap-4 @max-3xl/form-grid:grid-cols-1 @max-3xl/form-grid:*:col-span-1 @max-xl/form-grid:gap-3 @3xl/form-grid:gap-6"
          >
            <FormField v-slot="{ componentField }" name="mail.loginUrl">
              <FormItem>
                <FormLabel>{{ t('channels.mail_login_slug') }}</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon
                      align="inline-start"
                      class="min-w-0 shrink"
                    >
                      <InputGroupText
                        class="text-muted-foreground truncate text-xs"
                      >
                        {{ storefrontUrlDisplay }}
                      </InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      v-bind="componentField"
                      input-class="pl-0.5!"
                      class="shrink-0"
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="mail.passwordResetUrl">
              <FormItem>
                <FormLabel>
                  {{ t('channels.mail_password_reset_slug') }}
                </FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon
                      align="inline-start"
                      class="min-w-0 shrink"
                    >
                      <InputGroupText
                        class="text-muted-foreground truncate text-xs"
                      >
                        {{ storefrontUrlDisplay }}
                      </InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      v-bind="componentField"
                      input-class="pl-0.5!"
                      class="shrink-0"
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
        </FormGridWrap>
      </ContentSwitch>
    </ContentSection>
  </div>
</template>
