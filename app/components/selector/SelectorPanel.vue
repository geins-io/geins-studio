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
      <div class="grid h-full grid-cols-5 rounded-lg border">
        <div class="flex flex-col">
          Select from
          <button class="flex w-full items-center gap-1">
            <LucideTag class="size-3" />
            Products
          </button>
        </div>
        <div class="col-span-3 flex flex-col border-x">Select</div>
        <div class="flex flex-col">Selected</div>
      </div>
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
