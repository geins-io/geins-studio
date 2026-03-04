<script setup lang="ts">
import type { QuotationMessage } from '#shared/types';

const props = withDefaults(
  defineProps<{
    messages: QuotationMessage[];
    allCommunications?: QuotationMessage[];
    currentUserEmail?: string;
    mode?: 'external' | 'internal';
    editLoading?: boolean;
  }>(),
  {
    allCommunications: () => [],
    currentUserEmail: '',
    mode: 'internal',
    editLoading: false,
  },
);

const emit = defineEmits<{
  reply: [message: QuotationMessage];
  edit: [messageId: string, newText: string];
  delete: [messageId: string];
}>();

const { t } = useI18n();
const { formatDate } = useDate();

const editingMessageId = ref<string | null>(null);
const editText = ref('');

const startEdit = (msg: QuotationMessage) => {
  editingMessageId.value = msg._id;
  editText.value = msg.message;
};

const cancelEdit = () => {
  editingMessageId.value = null;
  editText.value = '';
};

const confirmEdit = (messageId: string) => {
  if (!editText.value.trim()) return;
  emit('edit', messageId, editText.value.trim());
};

watch(
  () => props.editLoading,
  (loading) => {
    if (!loading && editingMessageId.value !== null) {
      editingMessageId.value = null;
      editText.value = '';
    }
  },
);

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || '';
  const second = parts[1] || '';
  if (first && second) return `${first[0]}${second[0]}`.toUpperCase();
  if (first.length >= 2) return first.substring(0, 2).toUpperCase();
  return first[0]?.toUpperCase() || '';
};

const getParentMessage = (
  answerRef: string | null | undefined,
): QuotationMessage | null => {
  if (!answerRef) return null;
  const source = props.allCommunications.length
    ? props.allCommunications
    : props.messages;
  return source.find((m) => m._id === answerRef) || null;
};

const isOwnMessage = (msg: QuotationMessage): boolean => {
  return !!props.currentUserEmail && msg.authorId === props.currentUserEmail;
};

const isSent = (msg: QuotationMessage): boolean => msg.type === 'toCustomer';
</script>

<template>
  <Empty v-if="messages.length === 0" class="border-none py-8">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <LucideMessageSquare v-if="mode === 'external'" class="size-5" />
        <LucideNotebookPen v-else class="size-5" />
      </EmptyMedia>
      <EmptyTitle>
        {{
          mode === 'external'
            ? t('orders.no_external_messages')
            : t('orders.no_internal_messages')
        }}
      </EmptyTitle>
      <EmptyDescription>
        {{
          mode === 'external'
            ? t('orders.no_external_messages_description')
            : t('orders.no_internal_messages_description')
        }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
  <div v-else class="space-y-4">
    <div
      v-for="msg in messages"
      :id="`msg-${msg._id}`"
      :key="msg._id"
      class="flex"
      :class="{
        'justify-end': mode === 'external' && isSent(msg),
        'justify-start': mode === 'external' && !isSent(msg),
      }"
    >
      <div
        class="rounded-lg border p-4"
        :class="mode === 'external' ? 'w-4/5' : 'w-full'"
      >
        <!-- Reply excerpt -->
        <a
          v-if="getParentMessage(msg.answerRef)"
          :href="`#msg-${msg.answerRef}`"
          class="bg-muted/50 border-l-border mb-3 block rounded border-l-2 px-3 py-2 opacity-60 transition-opacity hover:opacity-100"
        >
          <p class="text-muted-foreground text-xs font-medium">
            {{ getParentMessage(msg.answerRef)!.authorName }}
          </p>
          <p class="truncate text-xs">
            {{ getParentMessage(msg.answerRef)!.message }}
          </p>
        </a>

        <!-- Header -->
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Avatar class="size-8 shrink-0 rounded-lg">
              <AvatarFallback class="rounded-lg text-xs">
                {{ getInitials(msg.authorName) }}
              </AvatarFallback>
            </Avatar>
            <div class="grid text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ msg.authorName }}</span>
              <span class="text-muted-foreground truncate text-xs">{{
                msg.authorId
              }}</span>
            </div>
            <Badge
              v-if="msg.type === 'quotationNote'"
              variant="secondary"
              class="text-xs"
            >
              {{ t('orders.notes') }}
            </Badge>
            <Badge
              v-if="mode === 'external' && msg.type === 'fromCustomer'"
              variant="secondary"
              class="text-xs"
            >
              {{ t('customer') }}
            </Badge>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground text-xs">
              {{ msg.timestamp ? formatDate(msg.timestamp) : '' }}
            </span>
            <!-- Actions dropdown -->
            <DropdownMenu v-if="currentUserEmail">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="size-7">
                  <LucideEllipsis class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="emit('reply', msg)">
                  <LucideCornerDownRight class="mr-2 size-4" />
                  {{ t('orders.reply') }}
                </DropdownMenuItem>
                <template v-if="isOwnMessage(msg)">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="startEdit(msg)">
                    <LucidePencil class="mr-2 size-4" />
                    {{ t('orders.edit_message') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="emit('delete', msg._id)"
                  >
                    <LucideTrash2 class="mr-2 size-4" />
                    {{ t('orders.delete_message') }}
                  </DropdownMenuItem>
                </template>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- Message body / inline edit -->
        <div class="pl-11">
          <template v-if="editingMessageId === msg._id">
            <Textarea v-model="editText" rows="3" class="mb-2" />
            <div class="flex justify-end gap-2">
              <Button variant="ghost" size="sm" @click="cancelEdit">
                {{ t('cancel') }}
              </Button>
              <Button
                size="sm"
                :loading="editLoading"
                :disabled="!editText.trim() || editLoading"
                @click="confirmEdit(msg._id)"
              >
                {{ t('save') }}
              </Button>
            </div>
          </template>
          <p v-else class="text-sm whitespace-pre-wrap">{{ msg.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
