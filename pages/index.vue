<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';

const { toast } = useToast();
const { t } = useI18n();

// TODO: Remove this function, only for testing purposes
const triggerToast = (
  variant: 'default' | 'destructive' | 'positive' | null | undefined,
) => {
  const title =
    variant === 'destructive'
      ? t('feedback_error')
      : t('feedback_welcome_back', { name: 'Test' });
  const description =
    variant === 'destructive'
      ? t('feedback_try_again')
      : t('feedback_welcome_back_description');
  toast({
    title,
    description,
    variant,
  });
};
</script>
<template>
  <ContentTitleBlock
    :title="$t('dashboard_title')"
    :description="$t('dashboard_description')"
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
