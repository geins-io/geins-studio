<script setup lang="ts">

</script>
<template>
    <div class="h-full mt-[--header-height]">
        <Header class="w-full fixed top-0 h-[--header-height]" />
        <div class="flex flex-wrap h-[calc(100vh_-_var(--header-height))]">
            <Sidebar class="w-56" />
            <div class="grow h-[calc(100vh_-_var(--header-height))] p-8 rounded-md border-l border-t bg-muted border-stone-200 dark:border-background">
                <slot />
            </div>
        </div>   
    </div>
</template>