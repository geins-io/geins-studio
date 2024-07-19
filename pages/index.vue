<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';

const { toast } = useToast();

// TODO: Remove this function, only for testing purposes
const triggerToast = (
  variant: 'default' | 'destructive' | 'positive' | null | undefined,
) => {
  const title =
    variant === 'destructive' ? 'Something went wrong' : 'Welcome back!';
  const description =
    variant === 'destructive'
      ? 'Please try again later.'
      : 'You have successfully logged in.';
  toast({
    title,
    description,
    variant,
  });
};
</script>
<template>
  <ContentTitleBlock
    title="Hi, these are your latest stats."
    description="All amounts will be shown excluding VAT. If you keep this page open, your stats will update every 60 seconds."
  />
  <div class="grid grid-cols-3 gap-8">
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent> Card Content </CardContent>
      <CardFooter>
        <Button @click="triggerToast('destructive')">
          Negative feedback
        </Button>
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent> Card Content </CardContent>
      <CardFooter>
        <Button @click="triggerToast('default')"> Neutral feedback </Button>
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent> Card Content </CardContent>
      <CardFooter>
        <Button @click="triggerToast('positive')"> Positive feedback </Button>
      </CardFooter>
    </Card>
  </div>
</template>
