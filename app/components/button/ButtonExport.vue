<script setup lang="ts"></script>
<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="secondary">
        <LucideFile class="mr-2 size-4" />
        Export list
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>
        <span>Export all</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <span>Export selection</span>
      </DropdownMenuItem>
      <slot />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
