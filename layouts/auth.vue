<script setup lang="ts">
// import svg from public folder

import Logo from '@/assets/logos/geins.svg';
</script>

<template>
    <div class="w-full h-screen lg:grid lg:grid-cols-2 lg:min-h-[600px] xl:min-h-[600px]">
        <div class="flex items-center justify-center py-12">
            <div class="mx-auto grid w-[350px] gap-6">
                <slot />
            </div>
        </div>
        <div class="hidden bg-muted lg:block">
            <Logo class="h-full w-full  dark:brightness-[0.2] dark:grayscale" />
        </div>
    </div>
</template>