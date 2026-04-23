<script setup lang="ts">
// Right-sliding sidebar shown when a workflow node is selected. Parent owns
// the `node` state and reacts to `close` / `delete` events. The panel stays
// mounted so the slide-out transition can run when `node` becomes `null`.
const props = defineProps<{
  node: any | null
}>()

const emit = defineEmits<{
  close: []
  delete: []
}>()

const isOpen = computed(() => props.node !== null)
</script>

<template>
  <div
    class="bg-background absolute inset-y-0 right-0 z-20 flex w-[calc(100%-20px)] flex-col border-l shadow-lg transition-transform duration-200 ease-in-out"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'">
    <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div class="flex items-center gap-2">
        <LucideSettings class="h-4 w-4" />
        <span class="text-sm font-medium">Node properties</span>
      </div>
      <div class="flex items-center gap-1">
        <button v-if="node" class="hover:bg-destructive/10 text-destructive rounded p-1.5"
          title="Delete node" @click="emit('delete')">
          <LucideTrash2 class="h-4 w-4" />
        </button>
        <button class="hover:bg-accent rounded p-1.5" title="Close" @click="emit('close')">
          <LucideX class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto" style="scrollbar-gutter: stable;">
      <div v-if="node" class="space-y-4 p-4">
        <template v-if="node.type !== 'trigger'">
          <div class="space-y-2">
            <label class="text-sm font-medium">Name</label>
            <input v-model="node.data.label" type="text"
              class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Description</label>
            <textarea v-model="node.data.description" rows="2"
              class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
          </div>
        </template>

        <div class="space-y-2">
          <label class="text-sm font-medium">Type</label>
          <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm capitalize">
            {{ node.type }}
          </div>
        </div>

        <template v-if="node.type === 'trigger'">
          <div class="border-t pt-4">
            <h4 class="mb-3 text-sm font-medium">Trigger</h4>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Trigger type</span>
                <span class="font-medium capitalize">{{ node.data.triggerType || 'onDemand' }}</span>
              </div>
              <div v-if="node.data.cronExpression" class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">Cron</span>
                <span class="font-mono text-xs">{{ node.data.cronExpression }}</span>
              </div>
              <div v-if="node.data.eventEntity || node.data.eventName" class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">Event</span>
                <span class="font-medium">
                  {{ node.data.eventEntity || node.data.eventName }}{{ node.data.eventAction ? ` / ${node.data.eventAction}` : '' }}
                </span>
              </div>
              <p class="text-muted-foreground border-t pt-3 text-xs">
                Trigger configuration is managed in the General tab.
              </p>
            </div>
          </div>
        </template>

        <template v-if="node.type === 'condition'">
          <div class="border-t pt-4">
            <h4 class="mb-3 text-sm font-medium">Condition Settings</h4>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Field</label>
                <input v-model="node.data.config.field" type="text" placeholder="data.status"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Operator</label>
                <select v-model="node.data.config.operator"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none">
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="is_empty">Is Empty</option>
                  <option value="is_not_empty">Is Not Empty</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Value</label>
                <input v-model="node.data.config.value" type="text" placeholder="active"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>
            </div>
          </div>
        </template>

        <template v-if="node.type === 'loop'">
          <div class="border-t pt-4">
            <h4 class="mb-3 text-sm font-medium">Loop Settings</h4>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Items Field</label>
                <input v-model="node.data.config.itemsField" type="text" placeholder="data.items"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Batch Size</label>
                <input v-model="node.data.config.batchSize" type="number" placeholder="1"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>
            </div>
          </div>
        </template>

        <template v-if="node.type === 'delay'">
          <div class="border-t pt-4">
            <h4 class="mb-3 text-sm font-medium">Delay Settings</h4>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Duration</label>
                <div class="flex gap-2">
                  <input v-model="node.data.config.duration" type="number" placeholder="5"
                    class="bg-background focus:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
                  <select v-model="node.data.config.unit"
                    class="bg-background focus:ring-ring rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none">
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="node.type === 'action' && node.data.icon === 'Mail'">
          <div class="border-t pt-4">
            <h4 class="mb-3 text-sm font-medium">Email Settings</h4>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">To</label>
                <input v-model="node.data.config.to" type="email" placeholder="user@example.com"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Subject</label>
                <input v-model="node.data.config.subject" type="text" placeholder="Email subject"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Body</label>
                <textarea v-model="node.data.config.body" rows="4" placeholder="Email body..."
                  class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>
            </div>
          </div>
        </template>

        <template v-if="node.type === 'action' && node.data.icon === 'Globe'">
          <div class="border-t pt-4">
            <h4 class="mb-3 text-sm font-medium">HTTP Request Settings</h4>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">URL</label>
                <input v-model="node.data.config.url" type="url" placeholder="https://api.example.com/endpoint"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Method</label>
                <select v-model="node.data.config.method"
                  class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Headers (JSON)</label>
                <textarea v-model="node.data.config.headers" rows="2"
                  placeholder='{"Authorization": "Bearer ..."}'
                  class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-sm">Body (JSON)</label>
                <textarea v-model="node.data.config.body" rows="4" placeholder='{"key": "value"}'
                  class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none" />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
