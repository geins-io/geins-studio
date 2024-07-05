<script setup lang="ts">
// get var from nuxt.config.ts
const config = useRuntimeConfig()
console.log('--> config', config)

</script>
<template>
  <ContentTitleBlock title="Hi, these are your latest stats."
    description="TEST All amounts will be shown excluding VAT. If you keep this page open, your stats will update every 60 seconds." />
  <div class="grid grid-cols-3 gap-8">
    <Card>
      <CardHeader>
        <CardTitle />
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        ()BASE_URL:<br> {{ config.public.BASE_URL }} <br><br>
        AUTH_ORIGIN:<br> {{ config.public.AUTH_ORIGIN }} <br><br>
        VERCEL_URL:<br> {{ config.public.VERCEL_URL }} <br><br>
        VERCEL:<br> {{ config.public.VERCEL }} <br><br>
        VERCEL_ENV:<br> {{ config.public.VERCEL_ENV }} <br><br>
        VERCEL_BRANCH_URL:<br> {{ config.public.VERCEL_BRANCH_URL }} <br><br>
        VERCEL_PROJECT_PRODUCTION_URL:<br> {{ config.public.VERCEL_PROJECT_PRODUCTION_URL }} <br><br>
        VERCEL_DEPLOYMENT_ID:<br> {{ config.public.VERCEL_DEPLOYMENT_ID }} <br><br>

      </CardContent>
      <CardFooter>
        <Button> Button </Button>
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent> Card Content </CardContent>
      <CardFooter>
        <Button> Button </Button>
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent> Card Content </CardContent>
      <CardFooter>
        <Button> Button </Button>
      </CardFooter>
    </Card>
  </div>
</template>
