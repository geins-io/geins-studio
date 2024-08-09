# Feedback system

## Introduction

Displaying feedback to the user is an important part of the user interface. It helps the user to understand the state of the application and the result of their actions. Feedback can be displayed in many ways, such as for example a loading indicator, a toast (instant message at the bottom of the screen) or an outline color of an input fieald.

Here follows a guide to Geins MC feedback system.

## Loading state and indicators

Thera are a few ways to show to the user that the application is loading or processing data. This section will walk you through the different ways to show loading state and indicators.

### Button loading indicator

Used to show that an action initiated by the user is being processed. The button is disabled and a spinner is shown inside the button.

```vue
<template>
  <Button :loading="pending"> Submit </Button>
</template>
```

### Skeletons

Used to show that data is being loaded. The skeleton is a placeholder for the data that is being loaded.

#### Data table skeleton

Will show a a table filled with cells containing a loading animation.

```vue{3}
<template>
  <TableView
    :loading="loading"
    :entity-name="entityName"
    :columns="columns"
    :data="data"
  />
</template>
```

#### Custom skeletons

To create custom skeletons, use the **Skeleton** component. You can read more about how to use it [here](https://www.shadcn-vue.com/docs/components/skeleton).

## Toasts

Toasts are used to show instant temporary feedback messages to the user. Often they come in different styles, like success, error and information.

To trigger a toast, use the `useToast` composable.

```vue
<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
const { toast } = useToast();

onMounted(() => {
  toast({
    title: 'Welcome back',
    description: 'You have successfullt logged in',
    variant: 'positive',
  });
});
</script>
```

**Toast function props**

```ts
interface Toast {
  title: string;
  description: string;
  variant: 'positive' | 'destructive' | 'default';
}
```

## Alerts

Alerts are messages that require the user to take an action. They are often used to show error messages or warnings and they ar not temporary like toasts.

For example, an alert can be shown abouve the login form if the user has entered the wrong password.

Use the **Alert** component to show a message to the user.

```vue
<template>
  <Alert v-if="showInvalid" variant="destructive">
    <ExclamationTriangleIcon class="w-4 h-4" />
    <AlertTitle> Invalid credentials </AlertTitle>
    <AlertDescription>
      Please check your email and password and try again.
    </AlertDescription>
  </Alert>
</template>
```

More information about the Alert component [here](https://www.shadcn-vue.com/docs/components/alert).
