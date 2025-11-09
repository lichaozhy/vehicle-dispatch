<template>
	<q-page
		class="column content-center"
		padding
	>
		<div class="full-width app-max-width">
			<div class="text-h5">Control Panel</div>
			<q-input
				v-model="id"
				readonly
				label="ID"
				dense
			></q-input>

			<q-input
				v-model="node"
				readonly
				label="Network"
				stack-label
				dense
			></q-input>

			<q-toolbar class="q-pl-none">
				<q-btn label="disconnect"></q-btn>
				<q-btn label="reconnect"></q-btn>
			</q-toolbar>

			<q-list></q-list>
			<div>My slave</div>
			<div>log</div>
			<div>detach</div>
			<div>mock disconnect</div>
			<div>mock reconnect</div>
			<app-master-virtual-node></app-master-virtual-node>
		</div>
	</q-page>
</template>

<script setup lang="ts">
import { inject, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { MASTER_USER, SET_TITLE } from 'src/Injection';
import { useNetwork } from 'src/network';
import AppMasterVirtualNode from './VirtualNode.vue';

const id = ref<string>(crypto.randomUUID());
const router = useRouter();
const user = inject(MASTER_USER)!;
const setTitle = inject(SET_TITLE)!;
const network = useNetwork({ type: 'master', id: id.value });
const node = ref<string | null>(null);

// network.node.addEventListener('message', e => {
// 	// console.log(e);
// });

onMounted(async () => {
	network.open();

	const VIRTUAL_NODE_CONNECT = JSON.stringify({
		action: 'detecting',
	});

	await network.broadcast(VIRTUAL_NODE_CONNECT);
});

onBeforeMount(async () => {
	if (user.value === null) {
		return await router.push({ name: 'app.master.authentication' });
	}

	const { name, isCommander } = user.value;

	setTitle(`${isCommander ? 'Commander ' : ''}Master - ${name}`);
});

onBeforeUnmount(() => {
	network.close();
});

defineOptions({ name: 'AppControllerScopeMainPage' });
</script>
