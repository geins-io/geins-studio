<script setup lang="ts"></script>
<template>
  <Sheet>
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="wide">
      <SheetHeader>
        <SheetTitle>Product selection</SheetTitle>
        <SheetDescription> Make your selection </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <SheetFooter>
          <SheetClose as-child>
            <Button variant="outline"> Cancel </Button>
          </SheetClose>
          <SheetClose as-child>
            <Button>Add selected</Button>
          </SheetClose>
        </SheetFooter>
      </SheetBody>
    </SheetContent>
  </Sheet>
</template>
