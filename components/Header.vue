<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import LogoDark from '@/assets/logos/geins-dark.svg'
import LogoLight from '@/assets/logos/geins-light.svg'

const colorMode = useColorMode()
const setColorMode = () => {
    colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
}

</script>
<template>
    <header class="flex items-center justify-between p-4 bg-primary h-12">
        <div>
            <LogoDark v-if="colorMode.value === 'dark'" :font-controlled="false" class="w-20" />
            <LogoLight v-else :font-controlled="false" class="w-20" />
        </div>
        <div>
            <Button variant="outline" size="icon" class="rounded-full w-8 h-8" @click="setColorMode">
                <Icon icon="radix-icons:moon" class="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Icon icon="radix-icons:sun" class="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </div>
    </header>
</template>