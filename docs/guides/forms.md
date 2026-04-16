# Forms in Entity Pages

How forms are built, validated, and laid out in Geins Studio entity edit pages. Covers the shadcn-vue + vee-validate integration, our custom layout and input components, and the `useEntityEdit` composable that ties it all together.

For shadcn-vue form docs see: https://shadcn-vue.com/docs/forms/vee-validate

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Form Primitives (ui/form/)](#form-primitives)
- [Zod Schema + toTypedSchema](#zod-schema--totypedschema)
- [FormField Binding Patterns](#formfield-binding-patterns)
- [Form Layout: FormGridWrap + FormGrid](#form-layout-formgridwrap--formgrid)
- [Custom Form Inputs](#custom-form-inputs)
- [Form Submission](#form-submission)
- [useEntityEdit Integration](#useentityedit-integration)
- [Step-Based Validation](#step-based-validation)
- [Unsaved Changes Tracking](#unsaved-changes-tracking)
- [Patterns & Rules](#patterns--rules)

---

## Architecture Overview

```
Zod schema ──► toTypedSchema() ──► useEntityEdit({ validationSchema }) ──► useForm()
                                                                              │
                                                                    form.values (reactive)
                                                                              │
                               ┌──────────────────────────────────────────────┤
                               ▼                                              ▼
                        <FormField name="...">                    onFormValuesChange()
                          └─ <FormItem>                              │
                               ├─ <FormLabel>                        ▼
                               ├─ <FormControl>                entityDataUpdate / entityDataCreate
                               │    └─ <Input v-bind="componentField">
                               └─ <FormMessage>               prepareUpdateData() / prepareCreateData()
                                                                     │
                                                                     ▼
                                                               API repository.update() / .create()
```

Key principle: **form values and entity data are separate**. The form (vee-validate) owns field-level validation and binding. Entity data refs (`entityDataUpdate`/`entityDataCreate`) own the API payload. The `onFormValuesChange` callback syncs form → entity. The `prepareUpdateData`/`prepareCreateData` callbacks shape entity → API payload.

---

## Form Primitives

Located in `app/components/ui/form/`. These are shadcn-vue components re-exported from vee-validate. All are auto-imported.

| Component         | Purpose                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FormField`       | vee-validate `Field` wrapper. Connects a named field to the form. Provides slot scope with `componentField`, `value`, `handleChange`                 |
| `FormItem`        | Container div with `space-y-1.5` spacing. Provides injection context for child components. Has `v-auto-animate` for smooth error message transitions |
| `FormLabel`       | Accessible `<label>` bound to form item ID. Turns red on validation error. Supports `:optional="true"` prop to show "(optional)" suffix              |
| `FormControl`     | Wrapper that applies `aria-describedby` and `aria-invalid` attributes to its child                                                                   |
| `FormMessage`     | Renders vee-validate `ErrorMessage` for the field. Auto-displays validation errors                                                                   |
| `FormDescription` | Muted helper text below a field                                                                                                                      |

### Validation trigger config

All automatic vee-validate triggers are **disabled** globally in `app/components/ui/form/index.ts`:

```ts
configure({
  validateOnBlur: false,
  validateOnChange: false,
  validateOnInput: false,
  validateOnModelUpdate: false,
});
```

Validation is triggered **programmatically** via `form.validate()` or `validateSteps()` — never on keystroke. This is intentional: errors appear only after the user attempts to save.

---

## Zod Schema + toTypedSchema

Every entity page defines a Zod schema converted with `toTypedSchema` from `@vee-validate/zod`. The schema structure maps directly to `FormField` `name` props via dot notation.

```ts
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

const formSchema = toTypedSchema(
  z.object({
    details: z.object({
      name: z.string().min(1, t('entity_required', { entityName: 'name' })),
      channels: z.array(z.string()).min(1, t('form.field_required')),
      tags: z.array(z.string()).optional(),
    }),
    addresses: z.object({
      billing: addressSchema,
      shipping: addressSchema.optional(),
    }),
  }),
);
```

The nested structure creates namespaced field names: `details.name`, `details.channels`, `addresses.billing.city`, etc.

### Rules

- Error messages are defined inline in Zod validators using `t()` for i18n
- Use `.optional()` for non-required fields — otherwise they are required by default
- Keep the schema in sync with the `<FormField name="...">` declarations in the template
- The schema is passed to `useEntityEdit({ validationSchema: formSchema })`

---

## FormField Binding Patterns

There are three patterns for binding form fields. Choose based on the input type.

### Pattern 1: componentField (standard inputs)

The most common pattern. Use for `<Input>`, `<Textarea>`, `<Select>`, and any component that accepts `modelValue` + `onUpdate:modelValue` via `v-bind`.

```vue
<FormField v-slot="{ componentField }" name="details.name">
  <FormItem>
    <FormLabel>{{ $t('name') }}</FormLabel>
    <FormControl>
      <Input v-bind="componentField" type="text" />
    </FormControl>
    <FormMessage />
  </FormItem>
</FormField>
```

`componentField` contains `{ modelValue, 'onUpdate:modelValue', name, onBlur }`. Spreading with `v-bind` wires up two-way binding automatically.

### Pattern 2: value + handleChange (custom components)

Use for components that need explicit `modelValue` / `@update:modelValue` separation, like `FormItemSwitch` or complex inputs.

```vue
<FormField v-slot="{ value, handleChange }" name="vat.exVat">
  <FormItemSwitch
    :label="$t('pricing.price_list_enter_prices_ex_vat')"
    :description="$t('pricing.price_list_enter_prices_ex_vat_description')"
    :model-value="value"
    @update:model-value="handleChange"
  />
</FormField>
```

### Pattern 3: No slot (read-only / disabled fields)

For display-only fields that should look visually consistent with editable fields but don't participate in form binding. Omit `v-slot` and bind `:model-value` directly.

```vue
<FormField name="identifier">
  <FormItem>
    <FormLabel>{{ $t('channels.identifier') }}</FormLabel>
    <FormControl>
      <Input :model-value="internalName" disabled />
    </FormControl>
    <FormDescription>{{ $t('channels.identifier_helper') }}</FormDescription>
  </FormItem>
</FormField>
```

### Pattern 4: componentField with extra handlers

When you need both form binding AND a custom handler (e.g., changing currency when channel changes):

```vue
<FormField v-slot="{ componentField }" name="default.channel">
  <FormItem>
    <FormLabel>{{ $t('pricing.price_list_channel') }}</FormLabel>
    <FormControl>
      <Select
        v-bind="componentField"
        :disabled="!createMode"
        @update:model-value="handleChannelChange"
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="ch in channels" :key="ch._id" :value="ch._id">
            {{ ch.name || ch.identifier }}
          </SelectItem>
        </SelectContent>
      </Select>
    </FormControl>
    <FormMessage />
  </FormItem>
</FormField>
```

### Pattern 5: componentField with complex inputs (tags, search)

For multi-value inputs that have their own API shape (e.g., `FormInputTagsSearch`), destructure and wire explicitly:

```vue
<FormField v-slot="{ componentField }" name="details.salesReps">
  <FormItem>
    <FormLabel :optional="true">{{ $t('sales_rep', 2) }}</FormLabel>
    <FormControl>
      <FormInputTagsSearch
        :model-value="componentField.modelValue"
        entity-name="sales_rep"
        :data-set="users"
        @update:model-value="componentField.handleChange"
      />
    </FormControl>
  </FormItem>
</FormField>
```

---

## Form Layout: FormGridWrap + FormGrid

Located in `app/components/form/`. These two components handle all form field layout.

### FormGridWrap

```vue
<!-- Source: app/components/form/FormGridWrap.vue -->
<div class="form-grid-wrap @container/form-grid space-y-3">
  <slot />
</div>
```

- No props — purely structural
- Creates a CSS container query context (`@container/form-grid`)
- Adds vertical spacing (`space-y-3`) between child `FormGrid` rows
- **Every group of FormGrid rows must be wrapped in a FormGridWrap**

### FormGrid

Single prop: `design` (defaults to `'1+1+1'`). Uses a 12-column Tailwind grid with nth-child selectors.

| Design      | Columns | Span Distribution | Use Case                                     |
| ----------- | ------- | ----------------- | -------------------------------------------- |
| `'1'`       | 1       | 12                | Full-width fields (URLs, textareas, toggles) |
| `'1+1'`     | 2       | 6 + 6             | Field pairs (first/last name, email/phone)   |
| `'1+1+1'`   | 3       | 4 + 4 + 4         | Dense info (name + channel + currency)       |
| `'1+1+1+1'` | 4       | 3 + 3 + 3 + 3     | Compact rows                                 |
| `'1+2'`     | 2       | 4 + 8             | Small label + wide input                     |
| `'2+1'`     | 2       | 8 + 4             | Wide input + small auxiliary                 |
| `'1+1+2'`   | 3       | 3 + 3 + 6         | Two small + one wide                         |
| `'2+1+1'`   | 3       | 6 + 3 + 3         | One wide + two small                         |
| `'2+2'`     | 2       | 6 + 6             | Two medium-width fields                      |

**Responsive behavior**: All designs collapse to single-column on small containers (`@max-xl/form-grid:grid-cols-1`). Gap increases from `gap-4` to `gap-6` on large containers (`@3xl/form-grid:gap-6`).

### Layout example

```vue
<FormGridWrap>
  <!-- Row 1: Name + Identifier side by side -->
  <FormGrid design="1+1">
    <FormField v-slot="{ componentField }" name="name">
      <FormItem>
        <FormLabel>{{ $t('name') }}</FormLabel>
        <FormControl><Input v-bind="componentField" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField name="identifier">
      <FormItem>
        <FormLabel>{{ $t('identifier') }}</FormLabel>
        <FormControl><Input :model-value="identifier" disabled /></FormControl>
      </FormItem>
    </FormField>
  </FormGrid>

  <!-- Row 2: URL full width -->
  <FormGrid design="1">
    <FormField v-slot="{ componentField }" name="url">
      <FormItem>
        <FormLabel>{{ $t('url') }}</FormLabel>
        <FormControl><Input v-bind="componentField" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </FormGrid>
</FormGridWrap>
```

### Nesting rules

```
<form @submit.prevent>
  <ContentEditCard>           ← Card container (title, description, step info)
    <FormGridWrap>            ← Container query context
      <FormGrid design="..."> ← Grid row
        <FormField>           ← Individual fields (one per grid cell)
        <FormField>
      </FormGrid>
      <FormGrid design="..."> ← Another row
        <FormField>
      </FormGrid>
    </FormGridWrap>
  </ContentEditCard>
</form>
```

Multiple `FormGridWrap` blocks can exist within a single card (e.g., separated by `border-t pt-6` for visual sections):

```vue
<FormGridWrap class="border-t pt-6">
  <ContentCardHeader title="..." size="md" heading-level="h3" />
  <FormGrid design="1">
    <!-- Section-specific fields -->
  </FormGrid>
</FormGridWrap>
```

---

## Custom Form Inputs

Located in `app/components/form/input/` and `app/components/form/item/`. All are auto-imported.

### Layout / Item Components

| Component              | Purpose                                                          | Props                                                  |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| `FormItemSwitch`       | Switch toggle with label + description in a bordered card layout | `label`, `description`, `disabled`, `v-model: boolean` |
| `FormInputDescription` | Styled muted text (xs, muted-foreground)                         | `class`                                                |

`FormItemSwitch` is special — it includes its own `FormItem`, `FormLabel`, `FormDescription`, and `FormControl` internally. Use it directly inside `FormField` without wrapping in `FormItem`:

```vue
<FormField v-slot="{ value, handleChange }" name="active">
  <FormItemSwitch
    :label="$t('active')"
    :model-value="value"
    @update:model-value="handleChange"
  />
</FormField>
```

### Input Components

| Component                 | v-model                  | Purpose                                                                                                                                                      |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FormInputSelectSearch`   | `string`                 | Combobox with search. Props: `dataSet`, `entityName`, `autocomplete`, `disableTeleport`                                                                      |
| `FormInputTagsSearch`     | `string[]`               | Multi-select tags with search. Generic `<T extends EntityBaseWithName>`. Props: `dataSet`, `entityName`, `placeholder`, `allowCustomTags`, `disableTeleport` |
| `FormInputChannels`       | `string[]`               | Channel multi-select. Wraps `FormInputTagsSearch` with channel data from store                                                                               |
| `FormInputCountrySelect`  | `string`                 | Country dropdown. Wraps `FormInputSelectSearch` with country data from store                                                                                 |
| `FormInputLanguageSelect` | `string`                 | Language dropdown. Props: `dataSet`, `showFlags`, `disableTeleport`                                                                                          |
| `FormInputMarketSelect`   | `string`                 | Market dropdown. Shows "{country} ({currency})" format. Props: `dataSet`, `disableTeleport`                                                                  |
| `FormInputDate`           | `string` (ISO)           | Date picker via Popover + Calendar. Props: `placeholder`, `minValue`                                                                                         |
| `FormInputColor`          | `string` (hex)           | Color picker button + hex text input                                                                                                                         |
| `FormInputFont`           | `string`                 | Font selector combobox with live preview                                                                                                                     |
| `FormInputImage`          | `string \| File \| null` | File picker with drag-drop and image preview                                                                                                                 |
| `FormInputRadioCards`     | `string`                 | 2-column grid of radio card options. Props: `options: SchemaFieldOption[]`                                                                                   |

### Usage within FormField

Custom inputs go inside `FormControl` just like primitives. If they accept `v-bind="componentField"` directly, use it. Otherwise, wire `modelValue` + `handleChange` explicitly:

```vue
<!-- Direct v-model-compatible input -->
<FormField v-slot="{ componentField }" name="details.country">
  <FormItem>
    <FormLabel>{{ $t('country') }}</FormLabel>
    <FormControl>
      <FormInputCountrySelect v-bind="componentField" />
    </FormControl>
    <FormMessage />
  </FormItem>
</FormField>

<!-- Input needing explicit wiring -->
<FormField v-slot="{ componentField }" name="details.tags">
  <FormItem>
    <FormLabel :optional="true">{{ $t('tag', 2) }}</FormLabel>
    <FormControl>
      <FormInputTagsSearch
        :model-value="componentField.modelValue"
        entity-name="tag"
        :data-set="tags"
        :allow-custom-tags="true"
        @update:model-value="componentField.handleChange"
      />
    </FormControl>
  </FormItem>
</FormField>
```

---

## Form Submission

### @submit.prevent on every form

Every entity form uses `<form @submit.prevent>`. This prevents browser default submission. The form element exists only for semantic HTML and accessibility — **submission is never handled by the form itself**.

```vue
<form @submit.prevent>
  <!-- All form content -->
</form>
```

The one exception is `AuthForm.vue` which uses `@submit.prevent="handleSubmit"` to handle Enter-key login. Entity pages never do this.

### How save actually works

Save/Create buttons use `@click` handlers that call `updateEntity()` or `createEntity()` from `useEntityEdit`:

```vue
<!-- In ContentEditHeader or page footer -->
<Button
  :loading="loading"
  :disabled="!formValid || loading"
  @click="handleUpdate"
>
  {{ $t('save_entity', { entityName }) }}
</Button>
```

```ts
const handleUpdate = async () => {
  await updateEntity(
    async () => {
      const stepsValid = await validateSteps([1, 2]);
      if (!stepsValid) {
        validateOnChange.value = true;
        return false;
      }
      validateOnChange.value = false;
      return true;
    },
    { fields: ['all'] },
  );
};
```

The `additionalValidation` callback runs before the API call. Return `false` to abort. Setting `validateOnChange.value = true` makes the debounced form watcher run `form.validate()` on subsequent changes — so error messages appear in real time after a failed save attempt.

---

## useEntityEdit Integration

`useEntityEdit` is the composable that connects forms to entity CRUD operations. Every entity edit page uses it.

### Setup

```ts
const {
  form, // vee-validate form instance
  formValid, // computed: form.meta.valid
  formTouched, // computed: form.meta.touched
  formValidation, // ref: last validation result
  validateOnChange, // ref<boolean>: enable live validation after failed save
  entityData, // computed: createMode ? entityDataCreate : entityDataUpdate
  entityDataCreate, // ref<TCreate>
  entityDataUpdate, // ref<TUpdate>
  entityId, // computed: route param ID
  createMode, // computed: ID === 'new'
  loading, // ref<boolean>
  hasUnsavedChanges, // computed: deep comparison
  unsavedChangesDialogOpen, // ref<boolean>
  confirmLeave, // function: confirm navigation away
  createEntity, // async function
  updateEntity, // async function
  deleteEntity, // async function
  validateSteps, // async function
  // ...more
} = useEntityEdit<TBase, TResponse, TCreate, TUpdate>({
  repository: domainApi.entity,
  entityName: t('entity'),
  entityListUrl: '/domain/entity/list',
  newEntityUrlAlias: 'new',
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  stepValidationMap: { 1: 'details', 2: 'addresses' },

  getInitialFormValues: (entityData, isCreate) => ({
    details: {
      name: entityData.name || '',
      channels: entityData.channels || [],
    },
  }),

  onFormValuesChange: (
    values,
    entityDataCreate,
    entityDataUpdate,
    createMode,
  ) => {
    const target = createMode.value ? entityDataCreate : entityDataUpdate;
    target.value = {
      ...entityData.value,
      ...values.details,
    };
  },

  reshapeEntityData: (apiResponse) => ({
    ...apiResponse,
    salesReps: apiResponse.salesReps?.map((sr) => sr._id),
  }),

  prepareCreateData: (formValues) => ({
    ...entityBase,
    ...formValues.details,
  }),

  prepareUpdateData: (formValues, entityDataUpdate) => ({
    name: formValues.details?.name,
    channels: formValues.details?.channels,
  }),

  parseEntityData: async (apiResponse) => {
    // Populate subsidiary refs from API response
    billingAddress.value = apiResponse.addresses?.find(
      (a) => a.type === 'billing',
    );
  },
});
```

### Data flow callbacks

| Callback               | Direction        | When                                                                                                        |
| ---------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `getInitialFormValues` | Entity → Form    | On mount / after fetch. Maps entity data to form field structure                                            |
| `onFormValuesChange`   | Form → Entity    | Debounced (500ms) after any form field change. Syncs form values into `entityDataCreate`/`entityDataUpdate` |
| `prepareCreateData`    | Entity → API     | Before `repository.create()`. Shapes the POST payload                                                       |
| `prepareUpdateData`    | Entity → API     | Before `repository.update()`. Shapes the PATCH payload                                                      |
| `reshapeEntityData`    | API → Entity     | After fetch. Transforms API response (e.g., extract IDs from nested objects)                                |
| `parseEntityData`      | API → Page State | After fetch. Populates subsidiary refs (addresses, sub-entities, etc.)                                      |

### Debounced form sync

Form value changes are debounced by 500ms (configurable via `options.debounceMs`). During the debounce window:

1. Form values update immediately (vee-validate handles this)
2. After 500ms idle, `onFormValuesChange` fires
3. If `validateOnChange` is `true`, `form.validate()` runs (shows/clears errors)
4. `entityDataUpdate`/`entityDataCreate` is synced

---

## Step-Based Validation

For multi-step create flows, the Zod schema top-level keys map to form steps via `stepValidationMap`.

### Setup

```ts
// Schema: top-level keys = step names
const formSchema = toTypedSchema(
  z.object({
    vat: z.object({ exVat: z.boolean().optional() }), // Step 1
    default: z.object({ name: z.string().min(1, '...') }), // Step 2
  }),
);

// Map step numbers to schema keys
const stepValidationMap: Record<number, string> = {
  1: 'vat',
  2: 'default',
};

// Pass to useEntityEdit
const { validateSteps } = useEntityEdit({
  validationSchema: formSchema,
  stepValidationMap,
  // ...
});
```

### Usage

```ts
// Validate single step
const step1Valid = await validateSteps([1]);

// Validate multiple steps
const allValid = await validateSteps([1, 2]);

// In create handler
const handleCreate = async () => {
  await createEntity(async () => {
    const valid = await validateSteps([1, 2]);
    if (!valid) {
      validateOnChange.value = true;
      return false;
    }
    return true;
  });
};
```

`validateSteps` runs `form.validate()`, then filters errors to only those matching the specified step keys. Step 1 errors won't block step 2 validation and vice versa.

---

## Unsaved Changes Tracking

Handled by `useUnsavedChanges` (called internally by `useEntityEdit`). Compares JSON-stringified `entityDataUpdate` against a saved snapshot.

### What you must do

1. **Always include `<DialogUnsavedChanges>` in the template** — without it, the route guard blocks navigation silently (stuck page, no error):

```vue
<DialogUnsavedChanges
  v-model:open="unsavedChangesDialogOpen"
  :entity-name="entityName"
  :loading="loading"
  @confirm="confirmLeave"
/>
```

2. The composable handles `onBeforeRouteLeave` automatically — no manual guard needed.

3. Use `excludeSaveFields` option to ignore fields that change without user action (timestamps, computed values):

```ts
useEntityEdit({
  excludeSaveFields: ['dateModified', 'modifiedBy'],
});
```

4. Use `externalChanges` for tracking changes outside the form (e.g., table edits, sub-entity modifications):

```ts
const externalChangesFlag = ref(false);

useEntityEdit({
  externalChanges: externalChangesFlag,
});

// Set when user modifies something outside the form
externalChangesFlag.value = true;
```

---

## Patterns & Rules

### Do

- **Always use `<form @submit.prevent>`** as the form wrapper
- **Always include `<FormMessage />`** on fields with validation rules — omitting it hides errors
- **Always match `FormField name` to Zod schema path** — `name="details.name"` maps to `z.object({ details: z.object({ name: ... }) })`
- **Use `FormLabel :optional="true"`** for optional fields — renders "(optional)" suffix
- **Use `FormDescription`** for helper text that is always visible (e.g., "Cannot be changed after creation")
- **Use `FormGridWrap` → `FormGrid`** for all field layout. Never use raw Tailwind grid on form fields
- **Disable save button** when form is invalid: `:disabled="!formValid || loading"`

### Don't

- **Don't use `@submit` handlers on entity forms** — use `@click` on save buttons calling `createEntity`/`updateEntity`
- **Don't trigger validation on input** — global config disables it. Use `validateOnChange` flag after failed save
- **Don't spread `entityDataUpdate` in `prepareUpdateData`** — explicitly pick the fields the API expects
- **Don't wrap `FormItemSwitch` in `FormItem`** — it includes its own `FormItem` internally
- **Don't use raw `<input>` or unbound components** — always wrap in `FormField` > `FormItem` > `FormControl` for consistent styling and accessibility
- **Don't cast `entityDataUpdate` to response type** — they are different types by design

### FormLabel optional prop

```vue
<!-- Required field (default) -->
<FormLabel>{{ $t('name') }}</FormLabel>

<!-- Optional field -->
<FormLabel :optional="true">{{ $t('tags') }}</FormLabel>
```

### FormDescription for immutable fields

```vue
<FormField v-slot="{ componentField }" name="default.channel">
  <FormItem>
    <FormLabel>{{ $t('channel') }}</FormLabel>
    <FormControl>
      <Select v-bind="componentField" :disabled="!createMode">
        <!-- options -->
      </Select>
    </FormControl>
    <FormDescription v-if="createMode">
      {{ $t('form.cannot_be_changed') }}
    </FormDescription>
    <FormMessage />
  </FormItem>
</FormField>
```
