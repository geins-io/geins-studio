<script setup lang="ts">
import JsonCodeEditor from '@/components/shared/JsonCodeEditor.vue';
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue';
import type { ManifestAction } from '@/composables/useWorkflowManifest';
import NodeSettingsCompose from './NodeSettingsCompose.vue';
import NodeSettingsHttpRequest from './NodeSettingsHttpRequest.vue';
import NodeSettingsTransform from './NodeSettingsTransform.vue';
import type { Component } from 'vue';

const ACTION_SETTINGS_COMPONENTS: Record<string, Component> = {
  'net.httpRequest': NodeSettingsHttpRequest,
  'transform.map': NodeSettingsTransform,
  'transform.compose': NodeSettingsCompose,
};

const props = defineProps<{
  nodeData: Record<string, unknown>;
  nodeInput: Record<string, unknown>;
  editorHints: Record<string, unknown>;
  manifestAction?: ManifestAction;
  updateInput: (name: string, value: unknown) => void;
  updateEditorHint: (name: string, value: unknown) => void;
}>();

const customComponent = computed(() => {
  const name = props.nodeData.actionName as string | undefined;
  return name ? ACTION_SETTINGS_COMPONENTS[name] : undefined;
});

const actionInputFields = computed(() => props.manifestAction?.input ?? []);

const requiredFields = computed(() =>
  actionInputFields.value.filter((f) => f.required),
);
const optionalFields = computed(() =>
  actionInputFields.value.filter((f) => !f.required),
);
const optionalOpen = ref(true);

const prettyLabel = (name: string): string =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ');

const isJsonEditor = (field: { editorHint?: string; type: string }): boolean =>
  field.editorHint === 'json' ||
  field.type.toLowerCase() === 'object' ||
  field.type.toLowerCase() === 'json';

function fieldToJson(field: { name: string; default?: unknown }): string {
  const val = props.nodeInput[field.name];
  if (val == null) return String(field.default ?? '');
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

function onJsonChange(fieldName: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    props.updateInput(fieldName, undefined);
    return;
  }
  try {
    props.updateInput(fieldName, JSON.parse(trimmed));
  } catch {
    props.updateInput(fieldName, text);
  }
}

const isSelect = (field: { allowedValues?: unknown[] }): boolean =>
  Array.isArray(field.allowedValues) && field.allowedValues.length > 0;

const isBoolean = (field: { type: string }): boolean => {
  const t = field.type.toLowerCase();
  return t === 'boolean' || t === 'bool';
};

function fieldToString(field: { name: string; default?: unknown }): string {
  const val = props.nodeInput[field.name];
  if (val == null) return String(field.default ?? '');
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

const typeBadgeClass = (type: string): string => {
  const t = type.toLowerCase();
  if (t === 'string') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  if (t === 'number' || t === 'integer' || t === 'int')
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  if (t === 'boolean' || t === 'bool')
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
  if (t === 'array') return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
  if (t === 'object' || t === 'json')
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  return 'bg-muted text-muted-foreground';
};
</script>

<template>
  <div class="h-full">
    <!-- Action-specific settings component -->
    <component
      :is="customComponent"
      v-if="customComponent"
      :node-data="nodeData"
      :node-input="nodeInput"
      :editor-hints="editorHints"
      :manifest-action="manifestAction"
      :update-input="updateInput"
      :update-editor-hint="updateEditorHint"
    />

    <!-- Generic manifest-driven form (fallback) -->
    <template v-else-if="actionInputFields.length">
      <!-- Required fields -->
      <div v-if="requiredFields.length" class="space-y-4">
        <div
          v-for="field in requiredFields"
          :key="field.name"
          class="space-y-1.5"
        >
          <Label
            class="text-muted-foreground flex items-center gap-1.5 text-sm"
          >
            {{ prettyLabel(field.name) }}
            <span class="text-destructive text-xs">*</span>
            <span
              class="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium"
              :class="typeBadgeClass(field.type)"
              >{{ field.type }}</span
            >
          </Label>
          <div v-if="isJsonEditor(field)" class="h-40">
            <JsonCodeEditor
              :model-value="fieldToJson(field)"
              :line-numbers="false"
              :line-wrapping="true"
              @update:model-value="onJsonChange(field.name, $event)"
            />
          </div>
          <Select
            v-else-if="isSelect(field)"
            :model-value="String(nodeInput[field.name] ?? field.default ?? '')"
            @update:model-value="updateInput(field.name, $event)"
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in field.allowedValues"
                :key="String(opt)"
                :value="String(opt)"
              >
                {{ opt }}
              </SelectItem>
            </SelectContent>
          </Select>
          <div v-else-if="isBoolean(field)" class="flex items-center gap-2">
            <Switch
              :checked="Boolean(nodeInput[field.name] ?? field.default)"
              @update:checked="updateInput(field.name, $event)"
            />
            <span class="text-muted-foreground text-xs">
              {{
                Boolean(nodeInput[field.name] ?? field.default)
                  ? 'Enabled'
                  : 'Disabled'
              }}
            </span>
          </div>
          <ExpressionInput
            v-else
            :model-value="fieldToString(field)"
            :placeholder="prettyLabel(field.name)"
            size="sm"
            :default-mode="
              fieldToString(field).includes('{{') ? 'expression' : 'fixed'
            "
            @update:model-value="updateInput(field.name, $event)"
          />
          <p v-if="field.description" class="text-muted-foreground text-xs">
            {{ field.description }}
          </p>
        </div>
      </div>

      <!-- Separator between required and optional -->
      <Separator
        v-if="requiredFields.length && optionalFields.length"
        class="my-4"
      />

      <!-- Optional fields in collapsible -->
      <Collapsible v-if="optionalFields.length" v-model:open="optionalOpen">
        <CollapsibleTrigger
          class="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <LucideChevronRight
            class="size-3.5 transition-transform"
            :class="optionalOpen && 'rotate-90'"
          />
          Optional ({{ optionalFields.length }})
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div class="mt-3 space-y-4">
            <div
              v-for="field in optionalFields"
              :key="field.name"
              class="space-y-1.5"
            >
              <Label
                class="text-muted-foreground flex items-center gap-1.5 text-sm"
              >
                {{ prettyLabel(field.name) }}
                <span
                  class="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium"
                  :class="typeBadgeClass(field.type)"
                  >{{ field.type }}</span
                >
              </Label>
              <div v-if="isJsonEditor(field)" class="h-40">
                <JsonCodeEditor
                  :model-value="fieldToJson(field)"
                  :line-numbers="false"
                  :line-wrapping="true"
                  @update:model-value="onJsonChange(field.name, $event)"
                />
              </div>
              <Select
                v-else-if="isSelect(field)"
                :model-value="
                  String(nodeInput[field.name] ?? field.default ?? '')
                "
                @update:model-value="updateInput(field.name, $event)"
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in field.allowedValues"
                    :key="String(opt)"
                    :value="String(opt)"
                  >
                    {{ opt }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div v-else-if="isBoolean(field)" class="flex items-center gap-2">
                <Switch
                  :checked="Boolean(nodeInput[field.name] ?? field.default)"
                  @update:checked="updateInput(field.name, $event)"
                />
                <span class="text-muted-foreground text-xs">
                  {{
                    Boolean(nodeInput[field.name] ?? field.default)
                      ? 'Enabled'
                      : 'Disabled'
                  }}
                </span>
              </div>
              <ExpressionInput
                v-else
                :model-value="fieldToString(field)"
                :placeholder="prettyLabel(field.name)"
                size="sm"
                :default-mode="
                  fieldToString(field).includes('{{') ? 'expression' : 'fixed'
                "
                @update:model-value="updateInput(field.name, $event)"
              />
              <p v-if="field.description" class="text-muted-foreground text-xs">
                {{ field.description }}
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </template>

    <!-- Empty state -->
    <div
      v-else-if="!customComponent"
      class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm"
    >
      <LucideSettings2 class="size-8 opacity-30" />
      <p>No configurable parameters</p>
    </div>
  </div>
</template>
