<script setup lang="ts">
const currentTab = ref(0);
const tabs = ['Main', 'Parameters', 'Prices'];
</script>
<template>
  <nav class="w-full">
    <ul class="flex gap-4">
      <li v-for="(tab, index) in tabs" :key="index">
        <Button
          variant="ghost"
          :class="
            cn(
              `${currentTab === index ? 'border-border bg-card hover:bg-card' : ''}`,
            )
          "
          @click="currentTab = index"
        >
          {{ tab }}
        </Button>
      </li>
    </ul>
  </nav>
</template>
