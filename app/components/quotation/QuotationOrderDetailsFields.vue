<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date';
import { calendarDayToLocalIso } from '#shared/utils/calendar-day';

const tomorrow = today(getLocalTimeZone()).add({ days: 1 });

// The picker emits the day at UTC midnight, which it then shows as the day
// before west of UTC. Holding local midnight shows the picked day everywhere.
const toPickedDay = (value?: string) =>
  value ? (calendarDayToLocalIso(value) ?? '') : '';
</script>

<template>
  <FormGridWrap>
    <FormGrid design="1+1">
      <FormField
        v-slot="{ componentField }"
        name="orderDetails.goodsLabel"
        :validate-on-model-update="true"
      >
        <FormItem>
          <FormLabel>{{ $t('orders.goods_label') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              :placeholder="$t('orders.goods_label')"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField
        v-slot="{ componentField }"
        name="orderDetails.customerOrderNumber"
        :validate-on-model-update="true"
      >
        <FormItem>
          <FormLabel>{{ $t('orders.customer_order_number') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              :placeholder="$t('orders.customer_order_number')"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </FormGrid>
    <FormGrid design="1+1">
      <FormField
        v-slot="{ value, handleChange }"
        name="orderDetails.desiredDeliveryDate"
      >
        <FormItem>
          <FormLabel>{{ $t('orders.desired_delivery_date') }}</FormLabel>
          <FormControl>
            <FormInputDate
              :model-value="value"
              :placeholder="$t('orders.desired_delivery_date')"
              :min-value="tomorrow"
              allow-clear
              @update:model-value="handleChange(toPickedDay($event))"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField
        v-slot="{ componentField }"
        name="orderDetails.customerReference"
        :validate-on-model-update="true"
      >
        <FormItem>
          <FormLabel>{{ $t('orders.customer_reference') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              :placeholder="$t('orders.customer_reference')"
            />
          </FormControl>
          <FormDescription>
            {{ $t('orders.customer_reference_hint') }}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>
    </FormGrid>
  </FormGridWrap>
</template>
