<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import type {
  ManifestAction,
  ManifestActionExample,
} from '@/composables/useWorkflowManifest';

const props = defineProps<{
  manifestAction: ManifestAction;
}>();

const { toast } = useToast();

const inputFields = computed(() => props.manifestAction.input ?? []);
const examples = computed(() => props.manifestAction.examples ?? []);

const complexFields = computed(() =>
  inputFields.value.filter((f) => {
    const t = f.type.toLowerCase();
    return t === 'array' || t === 'object' || t === 'json';
  }),
);

const hasSchemaInfo = computed(
  () => complexFields.value.length > 0 && examples.value.length > 0,
);

function getExampleForField(fieldName: string): unknown | null {
  for (const ex of examples.value) {
    if (ex.input && fieldName in ex.input) {
      return ex.input[fieldName];
    }
  }
  return null;
}

function getExampleJson(fieldName: string): string {
  const value = getExampleForField(fieldName);
  if (value == null) return '';
  if (Array.isArray(value) && value.length > 0) {
    return JSON.stringify(value[0], null, 2);
  }
  return JSON.stringify(value, null, 2);
}

function getArrayItemShape(fieldName: string): Record<string, string> | null {
  const value = getExampleForField(fieldName);
  if (!Array.isArray(value) || value.length === 0) return null;
  return extractShape(value[0]);
}

function getObjectShape(fieldName: string): Record<string, string> | null {
  const value = getExampleForField(fieldName);
  if (value == null || typeof value !== 'object' || Array.isArray(value))
    return null;
  return extractShape(value);
}

function extractShape(obj: unknown, prefix = ''): Record<string, string> {
  if (obj == null || typeof obj !== 'object') return {};
  const shape: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val === null) {
      shape[path] = 'string?';
    } else if (Array.isArray(val)) {
      shape[path] = 'array';
    } else if (typeof val === 'object') {
      shape[path] = 'object';
      Object.assign(shape, extractShape(val, path));
    } else {
      shape[path] = typeof val;
    }
  }
  return shape;
}

const expandedFields = ref<Set<string>>(new Set());

function toggleField(name: string) {
  if (expandedFields.value.has(name)) expandedFields.value.delete(name);
  else expandedFields.value.add(name);
}

function copyTemplate(fieldName: string) {
  const json = getExampleJson(fieldName);
  if (!json) return;
  navigator.clipboard.writeText(json);
  toast({
    title: 'Template copied',
    description: `Example shape for "${fieldName}" copied to clipboard.`,
  });
}

function copyFullExample(example: ManifestActionExample) {
  const json = JSON.stringify(example.input, null, 2);
  navigator.clipboard.writeText(json);
  toast({
    title: 'Example copied',
    description: `"${example.name}" copied to clipboard.`,
  });
}

const expandedExamples = ref<Set<number>>(new Set());

function toggleExample(idx: number) {
  if (expandedExamples.value.has(idx)) expandedExamples.value.delete(idx);
  else expandedExamples.value.add(idx);
}
</script>

<template>
  <div v-if="hasSchemaInfo" class="space-y-4">
    <!-- Complex field shapes -->
    <div v-for="field in complexFields" :key="field.name" class="space-y-1.5">
      <button
        class="flex w-full items-center gap-2 text-left"
        @click="toggleField(field.name)"
      >
        <LucideChevronRight
          class="text-muted-foreground h-3 w-3 shrink-0 transition-transform"
          :class="{ 'rotate-90': expandedFields.has(field.name) }"
        />
        <span class="text-sm font-medium">{{ field.name }}</span>
        <span v-if="field.required" class="text-destructive text-xs">*</span>
        <span
          class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]"
          >{{ field.type }}</span
        >
      </button>

      <p v-if="field.description" class="text-muted-foreground pl-5 text-xs">
        {{ field.description }}
      </p>

      <div v-if="expandedFields.has(field.name)" class="pl-5">
        <!-- Shape tree for array items -->
        <template
          v-if="
            field.type.toLowerCase() === 'array' &&
            getArrayItemShape(field.name)
          "
        >
          <div class="mb-2 flex items-center gap-1.5">
            <span
              class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase"
              >Item shape</span
            >
            <button
              class="text-muted-foreground hover:text-foreground rounded p-0.5"
              title="Copy item template as JSON"
              @click.stop="copyTemplate(field.name)"
            >
              <LucideCopy class="h-3 w-3" />
            </button>
          </div>
          <div class="space-y-0.5">
            <div
              v-for="(type, path) in getArrayItemShape(field.name)"
              :key="path"
              class="flex items-center gap-2 rounded px-2 py-1 font-mono text-[11px]"
              :class="
                String(path).includes('.') ? 'bg-muted/30 pl-6' : 'bg-muted/50'
              "
            >
              <span class="min-w-0 flex-1 truncate">{{ path }}</span>
              <span
                class="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium"
                :class="{
                  'bg-blue-500/10 text-blue-600 dark:text-blue-400':
                    type === 'string' || type === 'string?',
                  'bg-amber-500/10 text-amber-600 dark:text-amber-400':
                    type === 'number',
                  'bg-purple-500/10 text-purple-600 dark:text-purple-400':
                    type === 'boolean',
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400':
                    type === 'object',
                  'bg-teal-500/10 text-teal-600 dark:text-teal-400':
                    type === 'array',
                }"
                >{{ type }}</span
              >
            </div>
          </div>
        </template>

        <!-- Shape tree for objects -->
        <template v-else-if="getObjectShape(field.name)">
          <div class="mb-2 flex items-center gap-1.5">
            <span
              class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase"
              >Object shape</span
            >
            <button
              class="text-muted-foreground hover:text-foreground rounded p-0.5"
              title="Copy object template as JSON"
              @click.stop="copyTemplate(field.name)"
            >
              <LucideCopy class="h-3 w-3" />
            </button>
          </div>
          <div class="space-y-0.5">
            <div
              v-for="(type, path) in getObjectShape(field.name)"
              :key="path"
              class="bg-muted/50 flex items-center gap-2 rounded px-2 py-1 font-mono text-[11px]"
              :class="{ 'pl-6': String(path).includes('.') }"
            >
              <span class="min-w-0 flex-1 truncate">{{ path }}</span>
              <span
                class="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium"
                :class="{
                  'bg-blue-500/10 text-blue-600 dark:text-blue-400':
                    type === 'string' || type === 'string?',
                  'bg-amber-500/10 text-amber-600 dark:text-amber-400':
                    type === 'number',
                  'bg-purple-500/10 text-purple-600 dark:text-purple-400':
                    type === 'boolean',
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400':
                    type === 'object',
                  'bg-teal-500/10 text-teal-600 dark:text-teal-400':
                    type === 'array',
                }"
                >{{ type }}</span
              >
            </div>
          </div>
        </template>

        <div v-else class="text-muted-foreground text-xs italic">
          No example shape available
        </div>
      </div>
    </div>

    <!-- Full examples -->
    <div v-if="examples.length" class="border-t pt-3">
      <div
        class="text-muted-foreground mb-2 text-[10px] font-medium tracking-wider uppercase"
      >
        Examples
      </div>
      <div class="space-y-1">
        <div v-for="(example, idx) in examples" :key="idx">
          <div
            role="button"
            class="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors"
            @click="toggleExample(idx)"
          >
            <LucideChevronRight
              class="text-muted-foreground h-3 w-3 shrink-0 transition-transform"
              :class="{ 'rotate-90': expandedExamples.has(idx) }"
            />
            <div class="min-w-0 flex-1">
              <div class="font-medium">{{ example.name }}</div>
              <div
                v-if="example.description"
                class="text-muted-foreground truncate text-[11px]"
              >
                {{ example.description }}
              </div>
            </div>
            <button
              class="text-muted-foreground hover:text-foreground shrink-0 rounded p-1"
              title="Copy example input"
              @click.stop="copyFullExample(example)"
            >
              <LucideCopy class="h-3 w-3" />
            </button>
          </div>
          <div v-if="expandedExamples.has(idx)" class="mt-1 ml-5">
            <pre
              class="bg-muted/50 max-h-60 overflow-auto rounded border p-2 font-mono text-[11px]"
              >{{ JSON.stringify(example.input, null, 2) }}</pre
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
