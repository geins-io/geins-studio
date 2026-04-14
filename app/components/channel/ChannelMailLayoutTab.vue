<script setup lang="ts">
import type { ChannelMailSettings } from '#shared/types';

export type MailLayoutStagedFiles = {
  logoUrl?: File;
  headerImgUrl?: File;
};

const model = defineModel<Partial<ChannelMailSettings>>({ required: true });
const stagedFiles = defineModel<MailLayoutStagedFiles>('stagedFiles', {
  default: () => ({}),
});

const { t } = useI18n();

function update<K extends keyof ChannelMailSettings>(
  key: K,
  value: ChannelMailSettings[K],
) {
  model.value = { ...model.value, [key]: value };
}

function handleFile(key: 'logoUrl' | 'headerImgUrl', file: File | null) {
  const { logoUrl, headerImgUrl } = stagedFiles.value;
  const current = { logoUrl, headerImgUrl };
  current[key] = file ?? undefined;
  stagedFiles.value = {
    ...(current.logoUrl ? { logoUrl: current.logoUrl } : {}),
    ...(current.headerImgUrl ? { headerImgUrl: current.headerImgUrl } : {}),
  };
}

const backgroundColorKeys = [
  'backgroundColor',
  'bodyColor',
  'secondBodyColor',
  'headerColor',
  'footerColor',
] as const;

const textColorKeys = [
  'textColor',
  'footerTextColor',
  'saleTextColor',
  'notIncludedTextColor',
  'previouslyShippedTextColor',
  'backOrderedTextColor',
] as const;

const buttonColorKeys = ['buttonColor', 'buttonTextColor'] as const;

function colorLabel(
  key: keyof ChannelMailSettings,
): string {
  // Map CSS-case key -> snake_case i18n suffix.
  const map: Record<string, string> = {
    backgroundColor: 'background',
    bodyColor: 'body',
    secondBodyColor: 'second_body',
    headerColor: 'header',
    footerColor: 'footer',
    textColor: 'text',
    footerTextColor: 'footer_text',
    saleTextColor: 'sale_text',
    notIncludedTextColor: 'not_included_text',
    previouslyShippedTextColor: 'previously_shipped_text',
    backOrderedTextColor: 'back_ordered_text',
    buttonColor: 'button',
    buttonTextColor: 'button_text',
  };
  return t(`channels.mail_color_${map[key]}`);
}
</script>

<template>
  <div class="flex flex-col gap-8 pt-2">
    <!-- Images -->
    <section class="flex flex-col gap-3">
      <ContentCardHeader :title="t('channels.mail_images')" :description="t('channels.mail_images_desc')" icon="Images" size="md" />
      <FormGridWrap>
        <FormGrid design="1+1">
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_logo') }}</Label>
            <FormInputImage
              :model-value="model.logoUrl ?? ''"
              @update:model-value="handleFile('logoUrl', $event)"
            />
          </div>
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_header_image') }}</Label>
            <FormInputImage
              :model-value="model.headerImgUrl ?? ''"
              @update:model-value="handleFile('headerImgUrl', $event)"
            />
          </div>
        </FormGrid>
      </FormGridWrap>
    </section>

    <!-- Colors -->
    <section class="flex flex-col gap-3">
      <ContentCardHeader :title="t('channels.mail_colors')" :description="t('channels.mail_colors_desc')" icon="Palette" size="md" />
      <FormGridWrap>
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-3">
            <h4 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{{ t('channels.mail_color_group_backgrounds') }}</h4>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div v-for="key in backgroundColorKeys" :key="key" class="space-y-1.5">
                <Label>{{ colorLabel(key) }}</Label>
                <FormInputColor
                  :model-value="(model[key] as string) ?? ''"
                  :label="colorLabel(key)"
                  @update:model-value="update(key, $event)"
                />
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <h4 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{{ t('channels.mail_color_group_text') }}</h4>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div v-for="key in textColorKeys" :key="key" class="space-y-1.5">
                <Label>{{ colorLabel(key) }}</Label>
                <FormInputColor
                  :model-value="(model[key] as string) ?? ''"
                  :label="colorLabel(key)"
                  @update:model-value="update(key, $event)"
                />
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <h4 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{{ t('channels.mail_color_group_buttons') }}</h4>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div v-for="key in buttonColorKeys" :key="key" class="space-y-1.5">
                <Label>{{ colorLabel(key) }}</Label>
                <FormInputColor
                  :model-value="(model[key] as string) ?? ''"
                  :label="colorLabel(key)"
                  @update:model-value="update(key, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </FormGridWrap>
    </section>

    <!-- Typography -->
    <section class="flex flex-col gap-3">
      <ContentCardHeader :title="t('channels.mail_typography')" :description="t('channels.mail_typography_desc')" icon="FileType2" size="md" />
      <FormGridWrap>
        <FormGrid design="1+1">
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_font_family') }}</Label>
            <FormInputFont
              :model-value="model.fontFamily ?? ''"
              @update:model-value="update('fontFamily', $event)"
            />
          </div>
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_font_url') }}</Label>
            <Input
              :model-value="model.fontUrl ?? ''"
              type="url"
              @update:model-value="update('fontUrl', String($event))"
            />
          </div>
        </FormGrid>
        <FormGrid design="1+1+1">
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_font_size_small') }}</Label>
            <Input
              :model-value="model.fontSizeSmall ?? ''"
              placeholder="12px"
              @update:model-value="update('fontSizeSmall', String($event))"
            />
          </div>
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_font_size_medium') }}</Label>
            <Input
              :model-value="model.fontSizeMedium ?? ''"
              placeholder="14px"
              @update:model-value="update('fontSizeMedium', String($event))"
            />
          </div>
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_font_size_large') }}</Label>
            <Input
              :model-value="model.fontSizeLarge ?? ''"
              placeholder="18px"
              @update:model-value="update('fontSizeLarge', String($event))"
            />
          </div>
        </FormGrid>
        <FormGrid design="1">
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_line_height') }}</Label>
            <Input
              :model-value="model.lineHeight ?? ''"
              placeholder="1.4"
              @update:model-value="update('lineHeight', String($event))"
            />
          </div>
        </FormGrid>
      </FormGridWrap>
    </section>

    <!-- Shape -->
    <section class="flex flex-col gap-3">
      <ContentCardHeader :title="t('channels.mail_shape')" :description="t('channels.mail_shape_desc')" icon="RoundCorner" size="md" />
      <FormGridWrap>
        <FormGrid design="1+1">
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_border_radius') }}</Label>
            <Input
              :model-value="model.borderRadius ?? ''"
              placeholder="4px"
              @update:model-value="update('borderRadius', String($event))"
            />
          </div>
          <div class="space-y-1.5">
            <Label>{{ t('channels.mail_prod_img_size') }}</Label>
            <Input
              :model-value="model.prodImgSize ?? ''"
              placeholder="80px"
              @update:model-value="update('prodImgSize', String($event))"
            />
          </div>
        </FormGrid>
      </FormGridWrap>
    </section>

    <!-- Product display -->
    <section class="flex flex-col gap-3">
      <ContentCardHeader :title="t('channels.mail_product_display')" :description="t('channels.mail_product_display_desc')" icon="Package" size="md" />
      <div class="flex flex-col gap-3">
        <Item variant="outline" class="rounded-lg p-3">
          <ItemContent>
            <ItemTitle>{{ t('channels.mail_show_brand') }}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Switch
              :model-value="model.showBrand ?? false"
              @update:model-value="update('showBrand', $event)"
            />
          </ItemActions>
        </Item>
        <Item variant="outline" class="rounded-lg p-3">
          <ItemContent>
            <ItemTitle>{{ t('channels.mail_hide_article_number') }}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Switch
              :model-value="model.hideArticleNumber ?? false"
              @update:model-value="update('hideArticleNumber', $event)"
            />
          </ItemActions>
        </Item>
        <div class="space-y-1.5">
          <Label>{{ t('channels.mail_product_parameters') }}</Label>
          <Input
            :model-value="model.productParameters ?? ''"
            @update:model-value="update('productParameters', String($event))"
          />
          <FormInputDescription>
            {{ t('channels.mail_product_parameters_helper') }}
          </FormInputDescription>
        </div>
      </div>
    </section>
  </div>
</template>
