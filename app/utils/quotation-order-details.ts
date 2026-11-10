import * as z from 'zod';
import type { QuotationOrderDetails } from '#shared/types';
import { calendarDay, localDay } from '#shared/utils/calendar-day';
import {
  ORDER_DETAILS_MAX_LENGTH,
  ORDER_DETAILS_TEXT_FIELDS,
} from '#shared/utils/quotation';

/**
 * Zod schema for the order-detail form values, matching the API's validation.
 * `stored` returns what's saved: a stored value can't be cleared, only
 * replaced, and the delivery date has to be in the future only once it
 * changes (an older stored date isn't sent again).
 * @param t - i18n translation function
 * @param stored - The quotation's saved order details
 */
export function createOrderDetailsSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
  stored: () => QuotationOrderDetails | null | undefined,
) {
  return z
    .object({
      goodsLabel: z.string().optional(),
      customerOrderNumber: z.string().optional(),
      desiredDeliveryDate: z.string().optional(),
      customerReference: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      const saved = stored();
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });

      for (const field of ORDER_DETAILS_TEXT_FIELDS) {
        const value = values[field]?.trim() ?? '';
        const max = ORDER_DETAILS_MAX_LENGTH[field];
        if (!value && saved?.[field]) {
          issue(field, t('orders.order_details_cannot_clear'));
        } else if (value.length > max) {
          issue(field, t('form.max_characters', { max }));
        }
      }

      const date = values.desiredDeliveryDate;
      if (!date) {
        if (saved?.desiredDeliveryDate) {
          issue('desiredDeliveryDate', t('orders.order_details_cannot_clear'));
        }
        return;
      }
      const day = calendarDay(date);
      const unchanged =
        !!saved?.desiredDeliveryDate &&
        day === calendarDay(saved.desiredDeliveryDate);
      const today = localDay(new Date().toISOString());
      if (!unchanged && (!day || !today || day <= today)) {
        issue('desiredDeliveryDate', t('orders.delivery_date_in_future'));
      }
    });
}
