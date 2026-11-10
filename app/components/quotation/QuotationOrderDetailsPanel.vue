<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import type { QuotationOrderDetails } from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import {
  orderDetailsFormValues,
  orderDetailsRequest,
} from '#shared/utils/quotation';
import { useToast } from '@/components/ui/toast/use-toast';

const props = defineProps<{
  quotationId: string;
  orderDetails?: QuotationOrderDetails | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog(
  'components/quotation/QuotationOrderDetailsPanel.vue',
);
const { orderApi } = useGeinsRepository();

const entityKey = ENTITIES.quotation.key;

const open = defineModel<boolean>('open');
const loading = ref(false);

const form = useForm({
  validationSchema: toTypedSchema(
    z.object({
      orderDetails: createOrderDetailsSchema(t, () => props.orderDetails),
    }),
  ),
});

const { isDirty, captureBaseline } = usePanelDirty(() => form.values);

watch(open, (value) => {
  if (!value) return;
  // `force` replaces instead of merging, so nothing from the last open lingers
  form.resetForm(
    { values: { orderDetails: orderDetailsFormValues(props.orderDetails) } },
    { force: true },
  );
  captureBaseline();
});

const handleSave = async () => {
  const { valid } = await form.validate();
  if (!valid) return;

  const request = orderDetailsRequest(
    form.values.orderDetails,
    props.orderDetails,
  );
  if (!request) {
    open.value = false;
    return;
  }

  loading.value = true;
  try {
    await orderApi.quotation.updateOrderDetails(props.quotationId, request);
    toast({
      title: t('entity_updated', { entityKey }),
      variant: 'positive',
    });
    open.value = false;
    emit('saved');
  } catch (error) {
    geinsLogError('error saving order details:', getErrorMessage(error));
  } finally {
    loading.value = false;
  }
};
</script>
<template>
  <PanelEdit
    v-model:open="open"
    :title="$t('edit_entity', { entityKey: 'orders.order_details' })"
    :description="$t('orders.order_details_description')"
    :entity-key="entityKey"
    :dirty="isDirty"
    :loading="loading"
    :save-disabled="!isDirty"
    :save-label="$t('save_entity', { entityKey: 'orders.order_details' })"
    @save="handleSave"
  >
    <template #trigger>
      <slot />
    </template>
    <QuotationOrderDetailsFields />
  </PanelEdit>
</template>
