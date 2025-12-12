# Error Handling Migration Script

This document provides a step-by-step guide to migrate existing entity edit pages to use the new error handling system.

## Migration Checklist

For each entity edit page, follow these steps:

### Step 1: Identify Entity Edit Pages

Find all pages that match this pattern:

```
app/pages/**/[id].vue
```

Common locations:

- `app/pages/wholesale/price-list/[id].vue` ✅ COMPLETED
- `app/pages/wholesale/account/[id].vue` ✅ COMPLETED
- `app/pages/products/[id].vue` (if exists)
- `app/pages/*/[id].vue` (any other entity pages)

### Step 2: Locate Data Fetching Code

Find code that looks like this:

```typescript
// BEFORE - Pattern to look for
if (!createMode.value) {
  const { data, error } = await useAsyncData(() =>
    api.entity.get(entityId.value),
  );

  if (error.value) {
    toast({
      title: t('error_fetching_entity', { entityName }),
      description: t('feedback_error_description'),
      variant: 'negative',
    });
  }

  if (data.value) {
    await parseAndSaveData(data.value);
  }
}
```

### Step 3: Apply Error Handling

Replace the pattern with:

```typescript
// AFTER - New error handling pattern
if (!createMode.value) {
  // Add this line
  const { handleFetchError, validateEntityData } =
    useEntityError('entity_name');

  const { data, error } = await useAsyncData(() =>
    api.entity.get(entityId.value),
  );

  // Replace toast with fatal error handling
  if (error.value) {
    handleFetchError(error.value, entityId.value);
  }

  // Add validation
  const entity = validateEntityData(data.value, entityId.value);

  // Continue with validated entity
  await parseAndSaveData(entity);
}
```

### Step 4: Update Entity Name

Replace `'entity_name'` with the actual entity name:

**Entity Name Mapping:**

```typescript
// Wholesale
'price_list'; // Price lists
'wholesale_account'; // Wholesale accounts
'buyer'; // Buyers
'order'; // Orders

// Products
'product'; // Products
'category'; // Categories
'brand'; // Brands

// Use the same name as in useEntityUrl() if available
```

### Step 5: Test Each Page

For each migrated page:

1. **Test 404 Error:**
   - Navigate to non-existent entity ID
   - Verify Error404 component shows
   - Verify "Go Back" and "Go Home" work

2. **Test Valid Entity:**
   - Navigate to valid entity ID
   - Verify page loads normally
   - Verify no errors in console

3. **Test Create Mode:**
   - Navigate to `/entity/new`
   - Verify create mode works
   - No error handling should trigger

## Automated Search & Replace

### Using VS Code Find & Replace

#### Search Pattern:

```regex
if \(!createMode\.value\) \{\s*const \{ data, error(, refresh)? \} = await useAsyncData.*?\n.*?api\.(\w+)\.get\(entityId\.value.*?\).*?\);\s*if \(error\.value\) \{\s*toast\(\{[\s\S]*?\}\);\s*\}
```

This is complex - better to do manually.

### Manual Pattern Recognition

Look for these indicators:

1. `if (!createMode.value)` - Edit mode check
2. `useAsyncData` - Data fetching
3. `if (error.value)` - Error handling with toast
4. `if (data.value)` - Data existence check

## Example Migrations

### Example 1: Simple Entity Page

**Before:**

```vue
<script setup lang="ts">
const createMode = ref(route.params.id === 'new');

if (!createMode.value) {
  const { data, error } = await useAsyncData(() =>
    productApi.get(entityId.value),
  );

  if (error.value) {
    toast({
      title: 'Error loading product',
      variant: 'negative',
    });
  }

  if (data.value) {
    entityData.value = data.value;
  }
}
</script>
```

**After:**

```vue
<script setup lang="ts">
const createMode = ref(route.params.id === 'new');

if (!createMode.value) {
  const { handleFetchError, validateEntityData } = useEntityError('product');

  const { data, error } = await useAsyncData(() =>
    productApi.get(entityId.value),
  );

  if (error.value) {
    handleFetchError(error.value, entityId.value);
  }

  const product = validateEntityData(data.value, entityId.value);
  entityData.value = product;
}
</script>
```

### Example 2: Complex Entity with Multiple Fetches

**Before:**

```vue
<script setup lang="ts">
if (!createMode.value) {
  const { data, error } = await useAsyncData(() =>
    api.account.get(entityId.value, { fields: ['all'] }),
  );

  if (error.value) {
    toast({ title: 'Error loading account', variant: 'negative' });
  }

  if (data.value) {
    await parseAndSaveData(data.value);
  }

  // Load related data
  const { data: relatedData } = await useAsyncData(() =>
    api.relatedEntity.list(),
  );
}
</script>
```

**After:**

```vue
<script setup lang="ts">
if (!createMode.value) {
  const { handleFetchError, validateEntityData, showEntityErrorToast } =
    useEntityError('account');

  // Main entity - use fatal error handling
  const { data, error } = await useAsyncData(() =>
    api.account.get(entityId.value, { fields: ['all'] }),
  );

  if (error.value) {
    handleFetchError(error.value, entityId.value);
  }

  const account = validateEntityData(data.value, entityId.value);
  await parseAndSaveData(account);

  // Related data - use non-fatal error handling
  const { data: relatedData, error: relatedError } = await useAsyncData(() =>
    api.relatedEntity.list(),
  );

  if (relatedError.value) {
    await showEntityErrorToast(
      relatedError.value,
      'Failed to load related data',
    );
  }
}
</script>
```

### Example 3: With Watch and Refresh

**Before:**

```vue
<script setup lang="ts">
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData(() =>
    api.entity.get(entityId.value),
  );

  if (error.value) {
    toast({ title: 'Error', variant: 'negative' });
  }

  refreshEntityData.value = refresh;

  watch(
    data,
    async (newData) => {
      if (newData) {
        await parseAndSaveData(newData);
      }
    },
    { immediate: true },
  );
}
</script>
```

**After:**

```vue
<script setup lang="ts">
if (!createMode.value) {
  const { handleFetchError, validateEntityData } =
    useEntityError('entity_name');

  const { data, error, refresh } = await useAsyncData(() =>
    api.entity.get(entityId.value),
  );

  if (error.value) {
    handleFetchError(error.value, entityId.value);
  }

  const entity = validateEntityData(data.value, entityId.value);

  refreshEntityData.value = refresh;

  // Parse initial data
  await parseAndSaveData(entity);

  // Watch for updates (without immediate since we already parsed)
  watch(data, async (newData) => {
    if (newData) {
      await parseAndSaveData(newData);
    }
  });
}
</script>
```

## Common Pitfalls

### ❌ Don't: Apply to Create Mode

```typescript
// WRONG - Don't add error handling in create mode
if (createMode.value) {
  const { handleFetchError } = useEntityError('entity');
  // This will never fetch data, so error handling is unnecessary
}
```

### ❌ Don't: Use Fatal Errors for Recoverable Operations

```typescript
// WRONG - Don't use fatal errors for save/update failures
const handleSave = async () => {
  try {
    await api.entity.update(id, data);
  } catch (error) {
    handleFetchError(error); // This will navigate away!
  }
};

// RIGHT - Use toast for recoverable errors
const handleSave = async () => {
  try {
    await api.entity.update(id, data);
  } catch (error) {
    await showEntityErrorToast(error, 'Failed to save');
  }
};
```

### ❌ Don't: Forget to Remove Old Toast Code

```typescript
// WRONG - Leaving both error handlers
if (error.value) {
  handleFetchError(error.value, entityId.value); // Fatal error
  toast({ title: 'Error', variant: 'negative' }); // Dead code!
}

// RIGHT - Only use fatal error handler
if (error.value) {
  handleFetchError(error.value, entityId.value);
}
```

### ❌ Don't: Skip Data Validation

```typescript
// WRONG - Assuming data exists
if (error.value) {
  handleFetchError(error.value, entityId.value);
}
await parseAndSaveData(data.value); // Could be null!

// RIGHT - Validate data exists
if (error.value) {
  handleFetchError(error.value, entityId.value);
}
const entity = validateEntityData(data.value, entityId.value);
await parseAndSaveData(entity);
```

## Testing Checklist

After migration, test each page:

- [ ] Navigate to valid entity - page loads correctly
- [ ] Navigate to invalid ID - shows Error404 page
- [ ] "Go Back" button on error page works
- [ ] "Go Home" button on error page works
- [ ] Create mode (`/entity/new`) works without errors
- [ ] Console has no TypeScript errors
- [ ] Save/update operations still work
- [ ] Delete operations still work
- [ ] Related data loads correctly

## Rollback Plan

If issues occur after migration:

### Quick Rollback (Git)

```bash
git checkout HEAD -- app/pages/path/to/[id].vue
```

### Manual Rollback

Replace the new pattern with the old toast pattern and remove error handling imports.

## Progress Tracking

Create a tracking document to monitor progress:

```markdown
## Entity Edit Pages Migration

- [x] wholesale/price-list/[id].vue
- [x] wholesale/account/[id].vue
- [ ] products/[id].vue
- [ ] categories/[id].vue
- [ ] brands/[id].vue
- [ ] (add other pages as identified)

Total: 2/5 completed
```

## Getting Help

If you encounter issues during migration:

1. Review the [Error Handling Guide](./docs/guides/error-handling.md)
2. Check [useEntityError Documentation](./docs/composables/useEntityError.md)
3. Look at completed examples in:
   - `app/pages/wholesale/price-list/[id].vue`
   - `app/pages/wholesale/account/[id].vue`

## Post-Migration

After all pages are migrated:

1. **Remove old error handling patterns** (if any centralized ones exist)
2. **Update team documentation** with new patterns
3. **Add to code review checklist** for new entity pages
4. **Consider** adding ESLint rule to enforce pattern

## Success Criteria

Migration is complete when:

- [ ] All entity edit pages use new error handling
- [ ] All pages tested and working
- [ ] No console errors or warnings
- [ ] 404 pages show for invalid entity IDs
- [ ] Documentation updated
- [ ] Team trained on new pattern

---

**Good luck with the migration! 🚀**
