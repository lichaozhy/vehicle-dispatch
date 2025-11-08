<template>
	<q-layout view="lHh Lpr lFf">
		<q-header elevated>
			<q-toolbar>
				<q-space></q-space>
				<q-toolbar-title class="text-center">{{ title }}</q-toolbar-title>
				<q-space></q-space>
			</q-toolbar>
		</q-header>

		<q-page-container>
			<router-view />
		</q-page-container>
	</q-layout>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue';
import { SET_TITLE } from 'src/Injection';

function setTitle(value: string) {
	title.value = value;
	document.title = `VD - ${value}`;
}

const title = ref<string>('');

provide(SET_TITLE, setTitle);
defineExpose({ SET_TITLE });
</script>
