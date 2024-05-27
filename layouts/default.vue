<script setup lang="ts">

</script>
<template>
    <div class="h-full mt-12">
        <Header class="w-full fixed top-0" />
        <div class="flex flex-wrap h-[calc(100vh_-_3rem)]">
            <Sidebar class="w-56" />
            <div class="grow h-[calc(100vh_-_3rem)]">
                <slot />
            </div>
        </div>   
    </div>
</template>