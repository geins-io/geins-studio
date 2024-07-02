<script setup lang="ts">


</script>

<template>
    <div class="w-full h-screen lg:grid lg:grid-cols-2 lg:min-h-[600px] xl:min-h-[600px]">
        <div class="flex items-center justify-center py-12">
            <div class="mx-auto grid w-[350px] gap-6">
                <slot />
            </div>
        </div>
        <div class="hidden bg-muted lg:block">
            <img src="/placeholder.svg" alt="Image" width="1920" height="1080"
                class="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale">
        </div>
    </div>
</template>