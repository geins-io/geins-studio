<script setup lang="ts">
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

const showHeaders = ref(Object.keys(headersRaw.value).length > 0)
const showBody = ref(bodyRaw.value != null)
const showOptions = ref(false)

const needsBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(method.value))

const methodColor = computed(() => {
  switch (method.value) {
    case 'GET': return 'text-green-600 dark:text-green-400'
    case 'POST': return 'text-blue-600 dark:text-blue-400'
    case 'PUT': return 'text-amber-600 dark:text-amber-400'
    case 'PATCH': return 'text-orange-600 dark:text-orange-400'
    case 'DELETE': return 'text-red-600 dark:text-red-400'
    default: return ''
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Method + URL bar (n8n-style) -->
    <div class="space-y-1">
      <label class="text-sm font-medium">Request</label>
      <div class="flex gap-0">
        <select
          :value="method"
          class="bg-muted focus:ring-ring rounded-l-md border border-r-0 px-2 py-2 font-mono text-xs font-bold focus:ring-2 focus:outline-none"
          :class="methodColor"
          @change="method = ($event.target as HTMLSelectElement).value"
        >
          <option v-for="m in HTTP_METHODS" :key="m" :value="m">{{ m }}</option>
        </select>
        <input
          :value="url"
          placeholder="https://api.example.com/data"
          class="bg-background focus:ring-ring min-w-0 flex-1 rounded-r-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
          @input="url = ($event.target as HTMLInputElement).value"
        />
      </div>
    </div>

    <!-- Send Headers toggle -->
    <div class="border-t pt-3">
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
      <div v-if="showHeaders" class="mt-2 space-y-2">
        <div v-for="(pair, i) in headerPairs" :key="i" class="flex items-center gap-1">
          <input
            v-model="pair.key"
            placeholder="Name"
            class="bg-background focus:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs focus:ring-2 focus:outline-none"
            @blur="commitHeaders()"
          />
          <input
            v-model="pair.value"
            placeholder="Value"
            class="bg-background focus:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs focus:ring-2 focus:outline-none"
            @blur="commitHeaders()"
          />
          <button class="hover:bg-muted shrink-0 rounded p-1" @click="removeHeaderRow(i)">
            <LucideX class="text-muted-foreground h-3 w-3" />
          </button>
        </div>
        <button
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          @click="addHeaderRow"
        >
          <LucidePlus class="h-3 w-3" />
          Add header
        </button>
      </div>
    </div>

    <!-- Send Body toggle -->
    <div class="border-t pt-3">
      <button
        class="flex w-full items-center justify-between text-sm font-medium"
        @click="showBody = !showBody"
      >
        <span class="flex items-center gap-1.5">
          <LucideChevronRight class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-90': showBody }" />
          Body
        </span>
        <span v-if="!needsBody" class="text-muted-foreground text-[10px]">{{ method }} typically has no body</span>
      </button>
      <div v-if="showBody" class="mt-2 space-y-2">
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
        <div v-if="bodyMode === 'json'">
          <textarea
            v-model="bodyJson"
            rows="6"
            placeholder='{ "key": "value" }'
            class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-xs leading-relaxed focus:ring-2 focus:outline-none"
            @blur="commitBodyJson()"
          />
        </div>

        <!-- Key-value mode -->
        <div v-else class="space-y-2">
          <div v-for="(pair, i) in bodyPairs" :key="i" class="flex items-center gap-1">
            <input
              v-model="pair.key"
              placeholder="Key"
              class="bg-background focus:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs focus:ring-2 focus:outline-none"
              @blur="commitBodyPairs()"
            />
            <input
              v-model="pair.value"
              placeholder="Value"
              class="bg-background focus:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs focus:ring-2 focus:outline-none"
              @blur="commitBodyPairs()"
            />
            <button class="hover:bg-muted shrink-0 rounded p-1" @click="removeBodyRow(i)">
              <LucideX class="text-muted-foreground h-3 w-3" />
            </button>
          </div>
          <button
            class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            @click="addBodyRow"
          >
            <LucidePlus class="h-3 w-3" />
            Add field
          </button>
        </div>
      </div>
    </div>

    <!-- Options (collapsible) -->
    <div class="border-t pt-3">
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
          <input
            type="checkbox"
            :checked="throwOnError"
            class="rounded border"
            @change="throwOnError = ($event.target as HTMLInputElement).checked"
          />
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
