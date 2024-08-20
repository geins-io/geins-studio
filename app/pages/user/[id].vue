<script setup lang="ts">
import { useRoute } from 'vue-router';
import { User, AtSign, Phone } from 'lucide-vue-next';

const route = useRoute();
const entityName = (route.name as string)?.split('-')[0];

const { user } = useUserStore();

// create copy of user object to edit
const editUser = reactive({ ...user });

const fullName = computed(() => `${editUser.firstName} ${editUser.lastName}`);
</script>

<template>
  <ContentTitleBlock :title="`${user?.firstName} ${user?.lastName}`" />
  <ContentActionBar>
    <Button>{{ $t('save_entity', { entityName }) }}</Button>
    <Button variant="outline">New</Button>
    <Button variant="outline">Copy</Button>
  </ContentActionBar>
  <NuxtErrorBoundary>
    <div class="mx-auto max-w-6xl pt-12 lg:flex lg:flex-col">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">Edit profile</h1>
        <div class="rounded-lg bg-muted px-3 py-1 text-sm font-medium">
          User ID: {{ user?.id }}
        </div>
      </div>
      <div class="pb-12 lg:grid lg:grid-cols-2 lg:gap-12">
        <Card v-if="editUser" class="pt-6">
          <CardContent class="grid gap-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <Label for="firstName">First name</Label>
                <Input id="firstName" v-model="editUser.firstName" />
              </div>
              <div class="space-y-2">
                <Label for="lastName">Last name</Label>
                <Input id="lastName" v-model="editUser.lastName" />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="phone">Company</Label>
              <Input id="phone" v-model="editUser.company" />
            </div>
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input id="email" v-model="editUser.email" type="email" />
            </div>
            <div class="space-y-2">
              <Label for="phone">Phone</Label>
              <Input id="phone" v-model="editUser.phone" type="tel" />
            </div>

            <div class="space-y-2">
              <Label for="roles">Roles</Label>
              <div class="grid gap-2">
                <div class="flex items-center space-x-2">
                  <Checkbox id="admin-role" />
                  <Label for="admin-role">Admin</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="editor-role" />
                  <Label for="editor-role">Editor</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="viewer-role" />
                  <Label for="viewer-role">Viewer</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="developer-role" />
                  <Label for="developer-role">Developer</Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter class="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>{{ $t('save_entity', { entityName }) }}</Button>
          </CardFooter>
        </Card>

        <div class="bg-muted rounded-lg p-6 shadow-sm">
          <div class="flex items-center space-x-5">
            <Avatar class="h-16 w-16 bg-background">
              <AvatarFallback>
                <User :size="36" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 class="text-2xl font-bold">{{ fullName }}</h2>
              <p class="text-muted-foreground text-lg">
                {{ editUser?.company }}
              </p>
            </div>
          </div>
          <Separator class="my-6" />
          <div class="grid gap-4">
            <div>
              <div class="grid gap-2">
                <div
                  v-if="editUser.email"
                  class="flex items-center align-center space-x-3"
                >
                  <AtSign class="text-muted-foreground" :size="20" />
                  <span>{{ editUser.email }}</span>
                </div>
                <div v-if="editUser.phone" class="flex items-center space-x-3">
                  <Phone class="text-muted-foreground" :size="20" />
                  <span>{{ editUser.phone }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtErrorBoundary>
</template>
