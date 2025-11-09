<template>
	<q-page
		class="column content-center"
		padding
	>
		<div class="full-width app-max-width">
			<div class="text-h5">控制端面板</div>
			<q-input
				v-model="id"
				readonly
				label="ID"
				dense
			></q-input>

			<q-card
				class="q-mt-sm"
				flat
				bordered
			>
				<q-card-actions class="q-pb-none">
					<div class="text-h5">链路</div>
					<div style="font-size: 10px">{{ Network }}</div>
				</q-card-actions>
				<q-card-actions>
					<div class="row q-col-gutter-xs full-width">
						<div class="col-9">
							<q-input
								:model-value="binding.node.id"
								label="节点Id"
								dense
								readonly
								stack-label
							></q-input>
						</div>
						<div class="col-3">
							<q-input
								:model-value="bindingDowntime"
								label="无响应时间"
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
					<div class="text-h5">节点探测</div>
				</q-card-actions>
				<q-card-section>
					<q-list
						bordered
						separator
					>
						<q-item v-if="Object.keys(NodeDetection.record).length === 0">
							<q-item-section>没有节点 </q-item-section>
						</q-item>
						<q-item
							v-for="(node, id) in NodeDetection.record"
							:key="id"
						>
							<q-item-section>
								<q-item-label>节点ID: {{ id }}</q-item-label>
								<q-item-label caption>
									网络ID: {{ node.networkId ?? '-' }}
								</q-item-label>
								<q-item-label caption>
									无响应时间: {{ localTime - node.at }}
								</q-item-label>
							</q-item-section>
							<q-item-section side>
								<q-btn
									label="接入"
									color="primary"
									@click="requestBindNode(id)"
								></q-btn>
							</q-item-section>
						</q-item>
					</q-list>
				</q-card-section>
			</q-card>

			<q-card
				class="q-mt-sm"
				flat
				bordered
			>
				<q-card-actions class="q-pb-none">
					<div class="text-h5">车辆列表</div>
				</q-card-actions>
				<q-card-section>
					<q-list
						bordered
						separator
						dense
					>
						<q-item v-if="Object.keys(Slave.record).length === 0">
							<q-item-section> 没有车辆 </q-item-section>
						</q-item>
						<q-item
							v-for="(slave, id) in Slave.record"
							:key="id"
						>
							<q-item-section>
								<q-item-label>车辆Id: {{ id }}</q-item-label>
								<q-item-label caption>
									无响应时间: {{ localTime - slave.at }}
								</q-item-label>
								<q-item-label caption>
									控制端: {{ slave.masterList }}
								</q-item-label>
							</q-item-section>
							<q-item-section side>
								<q-btn
									label="控制"
									color="primary"
								></q-btn>
							</q-item-section>
						</q-item>
					</q-list>
				</q-card-section>
			</q-card>
			<div style="font-size: 10px;">{{ Master.record }}</div>

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

interface NetworkConfiguration {
	inquiry: boolean;
	race: boolean;
	commander: number;
	protocolList: string[];
	instructionList: string[];
}

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

interface SlaveAbstract {
	at: number;
	masterList: string[];
}

interface SlaveRegistry {
	record: Record<string, SlaveAbstract>;
}

interface SyncRegistry {
	at: number;
}

interface MasterAbstract {
	at: number;
	commander: boolean;
}

interface MasterRegistry {
	pingAt: number;
	record: Record<string, MasterAbstract>;
}

function MasterRegistry(): MasterRegistry {
	return {
		pingAt: 0,
		record: {},
	};
}

function NetworkConfiguration(): NetworkConfiguration {
	return {
		inquiry: false,
		race: false,
		commander: 0,
		protocolList: [],
		instructionList: [],
	};
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

function SlaveRegistry(): SlaveRegistry {
	return { record: {} };
}

function NodeDetectionRegistry(): NodeDetectionRegistry {
	return {
		record: {},
	};
}

function SyncRegistry(): SyncRegistry {
	return {
		at: 0,
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
const Slave = ref<SlaveRegistry>(SlaveRegistry());
const Network = ref<NetworkConfiguration>(NetworkConfiguration());
const Sync = ref<SyncRegistry>(SyncRegistry());
const Master = ref<MasterRegistry>(MasterRegistry());

const MessageHandler: Record<string, Record<string, MessageHandler>> = {
	node: {
		'network-beacon': ({ id, inquiry, race, commander }) => {
			if (binding.value.network.id !== id) {
				return;
			}

			Object.assign(Network.value, { inquiry, race, commander });
		},
		'node-beacon': ({ networkId }, source) => {
			NodeDetection.value.record[source.id!] = {
				networkId: networkId as string,
				at: Date.now(),
			};

			if (source.id === binding.value.node.id) {
				binding.value.network.id = networkId as string;
			}
		},
		ping: (_, source) => {
			binding.value.node = { pongAt: Date.now(), id: source.id! };
		},
		'slave-sync-incoming': ({ slaveId, masterList }) => {
			Slave.value.record[slaveId as string] = {
				at: Date.now(),
				masterList: masterList as string[],
			};
		},
		'master-sync-incoming': ({ masterId, commander }) => {
			Master.value.record[masterId as string] = {
				at: Date.now(),
				commander: commander as boolean,
			};
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

peer.node.addEventListener('data-seek', function releaseTimeoutBinding() {
	if (localTime.value - binding.value.node.pongAt > 10000) {
		binding.value = BindingRegistry();
	}
});

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

peer.node.addEventListener('data-seek', function sync() {
	if (binding.value.node.id === null) {
		return;
	}

	if (localTime.value - Sync.value.at < 1000) {
		return;
	}

	const { node } = binding.value;

	const message = JSON.stringify({
		action: 'sync',
		commander: user.value?.isCommander,
	});

	peer.send({ type: 'node', id: node.id }, message);
	Sync.value.at = Date.now();
});

onMounted(async () => {
	peer.open();
});

onBeforeMount(async () => {
	if (user.value === null) {
		return await router.push({ name: 'app.master.authentication' });
	}

	const { name, isCommander } = user.value;

	setTitle(`${isCommander ? '指挥官 ' : ''}控制端 - ${name}`);
});

onBeforeUnmount(() => {
	peer.close();
});

defineOptions({ name: 'AppControllerScopeMainPage' });
</script>
