<template>
	<RouterView></RouterView>
</template>

<script setup lang="ts">
import type { User } from 'src/Injection';
import { provide, ref } from 'vue';
import { MASTER_USER } from 'src/Injection';

const user = ref<User | null>(null);

provide(MASTER_USER, user);
defineOptions({ name: 'AppControllerScopePage' });
</script>
