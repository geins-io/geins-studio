<script setup lang="ts"></script>
<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <ButtonIcon icon="export" variant="secondary"> Export list </ButtonIcon>
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
