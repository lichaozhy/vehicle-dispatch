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
				v-model="binding.network.id"
				readonly
				label="Network"
				stack-label
				dense
			></q-input>

			<q-card
				class="q-mt-sm"
				flat
				bordered
			>
				<q-card-actions class="q-pb-none">
					<div class="text-h5">Link</div>
				</q-card-actions>
				<q-card-actions>
					<div class="row q-col-gutter-xs full-width">
						<div class="col-9">
							<q-input
								:model-value="binding.node.id"
								label="Node Id"
								dense
								readonly
								stack-label
							></q-input>
						</div>
						<div class="col-3">
							<q-input
								:model-value="bindingDowntime"
								label="Downtime"
								dense
								readonly
								stack-label
							></q-input>
						</div>
					</div>
				</q-card-actions>
			</q-card>

			<q-card
				class="q-mt-sm"
				flat
				bordered
			>
				<q-card-actions class="q-pb-none">
					<div class="text-h5">Node Detection</div>
				</q-card-actions>
				<q-card-section>
					<q-list
						bordered
						separator
					>
						<q-item v-if="Object.keys(NodeDetection.record).length === 0">
							<q-item-section> No node </q-item-section>
						</q-item>
						<q-item
							v-for="(node, id) in NodeDetection.record"
							:key="id"
						>
							<q-item-section>
								<q-item-label>Node Id: {{ id }}</q-item-label>
								<q-item-label caption>
									Network ID: {{ node.networkId ?? '-' }}
								</q-item-label>
								<q-item-label caption>
									Downtime: {{ localTime - node.at }}
								</q-item-label>
							</q-item-section>
							<q-item-section side>
								<q-btn
									label="bind"
									color="primary"
									@click="requestBindNode(id)"
								></q-btn>
							</q-item-section>
						</q-item>
					</q-list>
				</q-card-section>
			</q-card>

			<q-separator class="q-my-lg"></q-separator>

			<app-master-virtual-node></app-master-virtual-node>
		</div>
	</q-page>
</template>

<script setup lang="ts">
import type { Address } from 'src/network';

import {
	inject,
	onBeforeMount,
	onBeforeUnmount,
	onMounted,
	ref,
	computed,
} from 'vue';

import { useRouter } from 'vue-router';

import { MASTER_USER, SET_TITLE } from 'src/Injection';
import { useNetwork } from 'src/network';
import AppMasterVirtualNode from './VirtualNode.vue';

type MessageHandler = (
	body: { [key: string]: unknown },
	source: Address,
) => unknown;

interface BindingRegistry {
	pingAt: number;
	node: {
		id: string | null;
		pongAt: number;
	};
	network: {
		id: string | null;
	};
}

interface NodeDetectionAbstract {
	networkId: string | null;
	at: number;
}

interface NodeDetectionRegistry {
	record: Record<string, NodeDetectionAbstract>;
}

function BindingRegistry(): BindingRegistry {
	return {
		pingAt: 0,
		node: {
			id: null,
			pongAt: 0,
		},
		network: {
			id: null,
		},
	};
}

function NodeDetectionRegistry(): NodeDetectionRegistry {
	return {
		record: {},
	};
}

const bindingDowntime = computed(() => {
	const duration = localTime.value - binding.value.node.pongAt;

	return duration > 10000 ? 'Timeout' : duration;
});

const localTime = ref<number>(0);
const id = ref<string>(crypto.randomUUID());
const peer = useNetwork({ type: 'master', id: id.value });
const router = useRouter();
const user = inject(MASTER_USER)!;
const setTitle = inject(SET_TITLE)!;
const binding = ref<BindingRegistry>(BindingRegistry());
const NodeDetection = ref<NodeDetectionRegistry>(NodeDetectionRegistry());

const MessageHandler: Record<string, Record<string, MessageHandler>> = {
	node: {
		'node-beacon': ({ networkId }, source) => {
			NodeDetection.value.record[source.id!] = {
				networkId: networkId as string,
				at: Date.now(),
			};
		},
		ping: (_, source) => {
			binding.value.node = { pongAt: Date.now(), id: source.id! };
		},
	},
	master: {},
	slave: {},
};

function requestBindNode(nodeId: string) {
	peer.send(
		{
			type: 'node',
			id: nodeId,
		},
		JSON.stringify({ action: 'bind', commander: user.value?.isCommander }),
	);
}

peer.node.addEventListener('message', ({ source, message }) => {
	const { type } = source;
	const { action, ...body } = JSON.parse(message);
	const handler = MessageHandler[type!]?.[action as string];

	if (handler !== undefined) {
		handler(body, source);
	}
});

peer.node.addEventListener('data-seek', () => (localTime.value = Date.now()));

peer.node.addEventListener('data-seek', function clearTimeoutNode() {
	for (const [id, { at }] of Object.entries(NodeDetection.value.record)) {
		if (localTime.value - at > 10000) {
			delete NodeDetection.value.record[id];
		}
	}
});

peer.node.addEventListener('data-seek', async function pingBinding() {
	const { node, pingAt } = binding.value;

	if (node.id === null) {
		return;
	}

	const now = Date.now();

	if (now - pingAt < 1000) {
		return;
	}

	const PING_MESSAGE = JSON.stringify({
		action: 'ping',
		commander: user.value?.isCommander,
	});

	peer.send({ type: 'node', id: node.id }, PING_MESSAGE);
	binding.value.pingAt = now;
});

onMounted(async () => {
	peer.open();
});

onBeforeMount(async () => {
	if (user.value === null) {
		return await router.push({ name: 'app.master.authentication' });
	}

	const { name, isCommander } = user.value;

	setTitle(`${isCommander ? 'Commander ' : ''}Master - ${name}`);
});

onBeforeUnmount(() => {
	peer.close();
});

defineOptions({ name: 'AppControllerScopeMainPage' });
</script>
