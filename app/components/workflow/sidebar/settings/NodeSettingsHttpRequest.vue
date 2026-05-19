<script setup lang="ts">
import JsonCodeEditor from '@/components/shared/JsonCodeEditor.vue'
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue'

const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeInput: Record<string, unknown>
  updateInput: (name: string, value: unknown) => void
}>()

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const

const method = computed({
  get: () => (props.nodeInput.method as string) ?? 'GET',
  set: (v: string) => props.updateInput('method', v),
})

const url = computed({
  get: () => (props.nodeInput.url as string) ?? '',
  set: (v: string) => props.updateInput('url', v),
})

const timeout = computed({
  get: () => (props.nodeInput.timeout as number) ?? 30,
  set: (v: number) => props.updateInput('timeout', v),
})

const throwOnError = computed({
  get: () => Boolean(props.nodeInput.throwOnError),
  set: (v: boolean) => props.updateInput('throwOnError', v),
})

const httpClientName = computed({
  get: () => (props.nodeInput.httpClientName as string) ?? '',
  set: (v: string) => props.updateInput('httpClientName', v || undefined),
})

// --- Headers as key-value pairs ---

const headersRaw = computed(() => (props.nodeInput.headers ?? {}) as Record<string, unknown>)

const headerPairs = ref<Array<{ key: string, value: string }>>([])

const syncHeadersFromInput = () => {
  const h = headersRaw.value
  const entries = Object.entries(h).filter(([k]) => k !== '')
  headerPairs.value = entries.length > 0
    ? entries.map(([k, v]) => ({ key: k, value: String(v ?? '') }))
    : [{ key: '', value: '' }]
}
syncHeadersFromInput()
watch(headersRaw, syncHeadersFromInput, { deep: true })

const commitHeaders = () => {
  const obj: Record<string, string> = {}
  for (const p of headerPairs.value) {
    if (p.key.trim()) obj[p.key.trim()] = p.value
  }
  props.updateInput('headers', Object.keys(obj).length > 0 ? obj : undefined)
}

const addHeaderRow = () => {
  headerPairs.value.push({ key: '', value: '' })
}

const removeHeaderRow = (index: number) => {
  headerPairs.value.splice(index, 1)
  if (headerPairs.value.length === 0) headerPairs.value.push({ key: '', value: '' })
  commitHeaders()
}

// --- Body ---

const bodyMode = ref<'json' | 'keypair'>('json')

const bodyRaw = computed(() => props.nodeInput.body)

const bodyJson = ref('')

const bodyPairs = ref<Array<{ key: string, value: string }>>([])

const syncBodyFromInput = () => {
  const b = bodyRaw.value
  if (b == null) {
    bodyJson.value = ''
    bodyPairs.value = [{ key: '', value: '' }]
    return
  }
  if (typeof b === 'object') {
    bodyJson.value = JSON.stringify(b, null, 2)
    const entries = Object.entries(b as Record<string, unknown>).filter(([k]) => k !== '')
    bodyPairs.value = entries.length > 0
      ? entries.map(([k, v]) => ({ key: k, value: String(v ?? '') }))
      : [{ key: '', value: '' }]
  }
  else {
    bodyJson.value = String(b)
    bodyPairs.value = [{ key: '', value: '' }]
  }
}
syncBodyFromInput()
watch(bodyRaw, syncBodyFromInput, { deep: true })

const commitBodyJson = () => {
  const text = bodyJson.value.trim()
  if (!text) {
    props.updateInput('body', undefined)
    return
  }
  try {
    props.updateInput('body', JSON.parse(text))
  }
  catch {
    props.updateInput('body', text)
  }
}

const commitBodyPairs = () => {
  const obj: Record<string, string> = {}
  for (const p of bodyPairs.value) {
    if (p.key.trim()) obj[p.key.trim()] = p.value
  }
  props.updateInput('body', Object.keys(obj).length > 0 ? obj : undefined)
}

const addBodyRow = () => {
  bodyPairs.value.push({ key: '', value: '' })
}

const removeBodyRow = (index: number) => {
  bodyPairs.value.splice(index, 1)
  if (bodyPairs.value.length === 0) bodyPairs.value.push({ key: '', value: '' })
  commitBodyPairs()
}

// --- Expected status codes ---

const expectedStatusCodesRaw = computed(() => props.nodeInput.expectedStatusCodes)

const expectedStatusCodesText = computed({
  get: () => {
    const v = expectedStatusCodesRaw.value
    if (v == null) return ''
    if (Array.isArray(v)) return v.join(', ')
    return String(v)
  },
  set: (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) {
      props.updateInput('expectedStatusCodes', undefined)
      return
    }
    const codes = trimmed.split(/[,\s]+/).map(Number).filter(n => !isNaN(n) && n > 0)
    props.updateInput('expectedStatusCodes', codes.length > 0 ? codes : undefined)
  },
})

// --- Collapsible sections ---

const showRequest = ref(true)
const showHeaders = ref(Object.keys(headersRaw.value).length > 0)
const showBody = ref(bodyRaw.value != null)
const showOptions = ref(false)

const needsBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(method.value))

const methodColor = computed(() => {
  switch (method.value) {
    case 'GET': return 'text-green-600 dark:text-green-400'
    case 'POST': return 'text-amber-600 dark:text-amber-400'
    case 'PUT': return 'text-blue-600 dark:text-blue-400'
    case 'PATCH': return 'text-orange-600 dark:text-orange-400'
    case 'DELETE': return 'text-red-600 dark:text-red-400'
    default: return ''
  }
})

const methodBadgeColor = computed(() => {
  switch (method.value) {
    case 'GET': return 'bg-green-600 dark:bg-green-500'
    case 'POST': return 'bg-amber-600 dark:bg-amber-500'
    case 'PUT': return 'bg-blue-600 dark:bg-blue-500'
    case 'PATCH': return 'bg-orange-600 dark:bg-orange-500'
    case 'DELETE': return 'bg-red-600 dark:bg-red-500'
    default: return 'bg-muted'
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Method + URL bar -->
    <div class="pb-3">
      <button
        class="flex w-full items-center gap-1.5 text-sm font-medium"
        @click="showRequest = !showRequest"
      >
        <LucideChevronRight class="h-3.5 w-3.5 shrink-0 transition-transform" :class="{ 'rotate-90': showRequest }" />
        Request
        <span v-if="!showRequest" class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-white" :class="methodBadgeColor">
          {{ method }}
        </span>
      </button>
      <div v-if="!showRequest && url" class="text-muted-foreground mt-1 pl-5 font-mono text-[10px] leading-relaxed break-all">
        {{ url }}
      </div>
      <div v-if="showRequest" class="mt-2 flex items-stretch">
        <select
          :value="method"
          class="bg-muted focus:ring-ring -mr-px rounded-l-md border px-2 font-mono text-xs font-bold focus:relative focus:z-10 focus:ring-2 focus:outline-none"
          :class="methodColor"
          @change="method = ($event.target as HTMLSelectElement).value"
        >
          <option v-for="m in HTTP_METHODS" :key="m" :value="m">{{ m }}</option>
        </select>
        <div class="min-w-0 flex-1 [&_.group>div]:rounded-l-none [&_.group>input]:rounded-l-none [&_.group>textarea]:rounded-l-none">
          <ExpressionInput
            :model-value="url"
            placeholder="https://api.example.com/data"
            size="sm"
            expandable
            :default-mode="url.includes('{{') ? 'expression' : 'fixed'"
            @update:model-value="url = $event"
          />
        </div>
      </div>
    </div>

    <!-- Send Headers toggle -->
    <div class="border-t py-3">
      <button
        class="flex w-full items-center justify-between text-sm font-medium"
        @click="showHeaders = !showHeaders"
      >
        <span class="flex items-center gap-1.5">
          <LucideChevronRight class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-90': showHeaders }" />
          Headers
        </span>
        <span v-if="Object.keys(headersRaw).length > 0" class="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
          {{ Object.keys(headersRaw).length }}
        </span>
      </button>
      <div v-if="showHeaders" class="mt-2 divide-y">
        <div v-for="(pair, i) in headerPairs" :key="i" class="space-y-1 py-2 first:pt-0">
          <div class="flex items-center gap-1">
            <input
              v-model="pair.key"
              placeholder="Name"
              class="bg-background focus:ring-ring h-8 min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs focus:ring-2 focus:outline-none"
              @blur="commitHeaders()"
            />
            <Button class="hover:text-negative size-6 shrink-0 p-1" size="xs" variant="outline" @click="removeHeaderRow(i)">
              <LucideX class="size-3.5" />
            </Button>
          </div>
          <div class="flex items-start gap-1">
            <div class="min-w-0 flex-1">
              <ExpressionInput
                :model-value="pair.value"
                placeholder="Value"
                size="sm"
                :default-mode="pair.value.includes('{{') ? 'expression' : 'fixed'"
                @update:model-value="pair.value = $event; commitHeaders()"
              />
            </div>
            <div class="w-6 shrink-0" />
          </div>
        </div>
        <Button variant="outline" size="sm" class="mt-2 w-full" @click="addHeaderRow">
          <LucidePlus class="mr-1.5 h-3.5 w-3.5" />
          Add header
        </Button>
      </div>
    </div>

    <!-- Send Body toggle -->
    <div class="border-t py-3">
      <button
        class="flex w-full items-center justify-between text-sm font-medium"
        @click="showBody = !showBody"
      >
        <span class="flex items-center gap-1.5">
          <LucideChevronRight class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-90': showBody }" />
          Body
        </span>
        <span v-if="!needsBody" class="text-muted-foreground text-[10px]">No body</span>
      </button>
      <div v-if="showBody" class="mt-2 space-y-2">
        <p v-if="!needsBody" class="text-muted-foreground text-xs">
          {{ method }} requests do not have a body
        </p>
        <template v-else>
          <div class="flex gap-1">
            <button
              class="rounded-md px-2 py-1 text-xs font-medium"
              :class="bodyMode === 'json' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
              @click="bodyMode = 'json'"
            >
              JSON
            </button>
            <button
              class="rounded-md px-2 py-1 text-xs font-medium"
              :class="bodyMode === 'keypair' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
              @click="bodyMode = 'keypair'"
            >
              Key-Value
            </button>
          </div>

          <!-- JSON mode -->
          <div v-if="bodyMode === 'json'" class="flex h-72">
            <JsonCodeEditor
              :model-value="bodyJson"
              :line-numbers="false"
              :line-wrapping="true"
              @update:model-value="bodyJson = $event; commitBodyJson()"
            />
          </div>

          <!-- Key-value mode -->
          <div v-else>
            <div class="divide-y">
              <div v-for="(pair, i) in bodyPairs" :key="i" class="space-y-1 py-2 first:pt-0">
                <div class="flex items-center gap-1">
                  <input
                    v-model="pair.key"
                    placeholder="Key"
                    class="bg-background focus:ring-ring h-8 min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs focus:ring-2 focus:outline-none"
                    @blur="commitBodyPairs()"
                  />
                  <Button class="hover:text-negative size-6 shrink-0 p-1" size="xs" variant="outline" @click="removeBodyRow(i)">
                    <LucideX class="size-3.5" />
                  </Button>
                </div>
                <div class="flex items-start gap-1">
                  <div class="min-w-0 flex-1">
                    <ExpressionInput
                      :model-value="pair.value"
                      placeholder="Value"
                      size="sm"
                      :default-mode="pair.value.includes('{{') ? 'expression' : 'fixed'"
                      @update:model-value="pair.value = $event; commitBodyPairs()"
                    />
                  </div>
                  <div class="w-6 shrink-0" />
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" class="mt-2 w-full" @click="addBodyRow">
              <LucidePlus class="mr-1.5 h-3.5 w-3.5" />
              Add field
            </Button>
          </div>
        </template>
      </div>
    </div>

    <!-- Options (collapsible) -->
    <div class="border-t py-3">
      <button
        class="flex w-full items-center gap-1.5 text-sm font-medium"
        @click="showOptions = !showOptions"
      >
        <LucideChevronRight class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-90': showOptions }" />
        Options
      </button>
      <div v-if="showOptions" class="mt-3 space-y-3">
        <!-- Timeout -->
        <div class="space-y-1">
          <label class="text-muted-foreground text-xs">Timeout (seconds)</label>
          <input
            type="number"
            :value="timeout"
            min="1"
            max="300"
            class="bg-background focus:ring-ring w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
            @input="timeout = Number(($event.target as HTMLInputElement).value) || 30"
          />
        </div>

        <!-- Throw on error -->
        <div class="flex items-center justify-between gap-2">
          <div>
            <label class="text-xs font-medium">Throw on error</label>
            <p class="text-muted-foreground text-[10px]">Fail the node on HTTP errors</p>
          </div>
          <Switch v-model="throwOnError" />
        </div>

        <!-- Expected status codes -->
        <div class="space-y-1">
          <label class="text-muted-foreground text-xs">Expected status codes</label>
          <input
            :value="expectedStatusCodesText"
            placeholder="e.g. 200, 201, 204"
            class="bg-background focus:ring-ring w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
            @input="expectedStatusCodesText = ($event.target as HTMLInputElement).value"
          />
          <p class="text-muted-foreground text-[10px]">Comma-separated. Responses outside this set are treated as errors.</p>
        </div>

        <!-- HTTP client name -->
        <div class="space-y-1">
          <label class="text-muted-foreground text-xs">HTTP client name</label>
          <input
            :value="httpClientName"
            placeholder="e.g. MonitorSession"
            class="bg-background focus:ring-ring w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
            @input="httpClientName = ($event.target as HTMLInputElement).value"
          />
          <p class="text-muted-foreground text-[10px]">Named HTTP client for session sharing between nodes.</p>
        </div>
      </div>
    </div>
  </div>
</template>
