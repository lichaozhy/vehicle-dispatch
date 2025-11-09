<template>
	<div>
		<div class="text-h5">
			虚拟中心节点
			<q-badge
				align="top"
				:color="isPrimary ? 'primary' : 'secondary'"
				>{{ isPrimary ? '主要' : '从属' }}</q-badge
			>
		</div>

		<q-card
			class="q-mt-sm"
			flat
			bordered
		>
			<q-card-section class="q-pb-none">
				<div class="text-h6">节点</div>
			</q-card-section>
			<q-card-section class="q-pb-none">
				<q-input
					v-model="node.id"
					readonly
					label="节点ID"
					stack-label
					dense
				></q-input>
			</q-card-section>

			<q-card-section class="q-pb-none">
				<div class="text-h6">控制端表</div>
			</q-card-section>
			<q-card-section class="q-pb-none">
				<q-list
					bordered
					separator
					dense
				>
					<q-item v-if="Object.keys(Master.record).length === 0">
						<q-item-section>没有控制端</q-item-section>
					</q-item>
					<q-item
						v-for="(master, id) in Master.record"
						:key="id"
					>
						<q-item-section>
							<q-item-label>{{ id }}</q-item-label>
							<q-item-label caption
								>无响应时间: {{ localTime - master.at }}</q-item-label
							>
						</q-item-section>
					</q-item>
				</q-list>
			</q-card-section>

			<q-card-section class="q-pb-none">
				<div class="text-h6">车辆表</div>
			</q-card-section>
			<q-card-section>
				<q-list
					bordered
					separator
					dense
				>
					<q-item v-if="Object.keys(slaveRecord).length === 0">
						<q-item-section>没有车辆</q-item-section>
					</q-item>
					<q-item
						v-for="(slaveItem, slaveId) in slaveRecord"
						:key="slaveId"
					>
						<q-item-section>
							<q-item-label>{{ slaveId }}</q-item-label>
							<q-item-label caption
								>无响应时间: {{ localTime - slaveItem.at }}</q-item-label
							>
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
			<q-card-section class="q-pb-none">
				<div class="text-h6">当前网络</div>
			</q-card-section>
			<q-card-section class="q-pb-none">
				<q-form @submit.prevent="updateNetwork">
					<div class="row q-col-gutter-xs">
						<div class="col-12">
							<q-input
								v-model="network.id"
								readonly
								label="网络ID"
								stack-label
								dense
							></q-input>
						</div>
						<div class="col-3">
							<q-input
								label="请求模式"
								dense
								readonly
								:model-value="network.configuration.inquiry ? '是' : '否'"
							></q-input>
						</div>
						<div class="col-3">
							<q-input
								label="抢占模式"
								dense
								readonly
								:model-value="network.configuration.race ? '是' : '否'"
							></q-input>
						</div>
						<div class="col-3">
							<q-input
								label="指挥官数量"
								dense
								readonly
								stack-label
								type="number"
								v-model="network.configuration.commander"
							></q-input>
						</div>
						<div class="col-3">
							<q-input
								label="无响应时间"
								dense
								readonly
								stack-label
								:model-value="downtime"
							></q-input>
						</div>
					</div>
					<q-toolbar class="q-px-none">
						<q-btn
							class="q-mr-xs"
							label="退出网络"
							icon="cancel"
							color="negative"
							:disable="network.id === null"
							@click="destroyNetwork"
						></q-btn>
					</q-toolbar>
				</q-form>
			</q-card-section>
			<q-card-section>
				{{ network.topology }}
			</q-card-section>
		</q-card>

		<q-card
			class="q-mt-sm"
			flat
			bordered
		>
			<q-card-section class="q-pb-none">
				<div class="text-h6">从本地创建并配置主网络</div>
			</q-card-section>
			<q-card-section class="q-pb-none">
				<q-form @submit.prevent="updateNetwork">
					<div class="row q-col-gutter-xs">
						<div class="col-4">
							<q-toggle
								label="请求模式"
								dense
								v-model="networkConfiguration.inquiry"
							></q-toggle>
						</div>
						<div class="col-4">
							<q-toggle
								label="抢占模式"
								dense
								v-model="networkConfiguration.race"
							></q-toggle>
						</div>
						<div class="col-4">
							<q-input
								label="指挥官数量"
								dense
								stack-label
								type="number"
								v-model="networkConfiguration.commander"
							></q-input>
						</div>
					</div>
					<q-toolbar class="q-px-none">
						<q-btn
							class="q-mr-xs"
							label="创建新网络"
							icon="wifi"
							color="primary"
							type="submit"
						></q-btn>
						<q-space></q-space>
						<q-file
							dense
							filled
							square
							v-model="file"
							label="导入"
						>
							<template v-slot:prepend>
								<q-icon name="file_download" />
							</template>
						</q-file>
					</q-toolbar>
				</q-form>
			</q-card-section>
		</q-card>
		<q-card
			class="q-mt-sm"
			flat
			bordered
		>
			<q-card-section class="q-pb-none">
				<div class="text-h6">网络搜索</div>
			</q-card-section>

			<q-card-section>
				<q-list
					bordered
					separator
				>
					<q-item v-if="networkSearchList.length === 0">
						<q-item-section>无网络</q-item-section>
					</q-item>
					<q-item
						v-for="item in networkSearchList"
						:key="item.id"
					>
						<q-item-section>
							<q-item-label>网络Id: {{ item.id }}</q-item-label>
							<q-item-label caption>
								<q-badge
									v-if="item.inquiry"
									color="primary"
									>请求模式</q-badge
								>
								<q-badge
									v-if="item.race"
									color="negative"
									>抢占模式</q-badge
								>
								<q-badge
									color="grey"
									class="text-center"
									style="width: 5em"
									>{{ Math.max(localTime - item.at, 0) }}</q-badge
								>
							</q-item-label>
						</q-item-section>
						<q-item-section side>
							<q-btn
								label="加入网络"
								color="primary"
								@click="joinNetworkByNodeId(item.node)"
							></q-btn>
						</q-item-section>
					</q-item>
				</q-list>
			</q-card-section>
		</q-card>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue';
import type { Address } from 'src/network';
import { useNetwork } from 'src/network';

interface NetworkConfiguration {
	inquiry: boolean;
	race: boolean;
	commander: number;
	protocolList: string[];
	instructionList: string[];
}

interface SearchItem {
	node: string;
	at: number;
	inquiry: boolean;
	race: boolean;
	commander: number;
}

interface NetworkTopology {
	primary: string | null;
	secondaries: Record<string, number>;
}

interface NetworkState {
	id: null | string;
	beacon: ReturnType<typeof setInterval> | null;
	configuration: NetworkConfiguration;
	searchRecord: Record<string, SearchItem>;
	topology: NetworkTopology;
	at: number;
}

interface NodeState {
	id: string | null;
	beacon: ReturnType<typeof setInterval> | null;
}

interface SlaveAbstract {
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

type MessageHandler = (
	body: { [key: string]: unknown },
	source: Address,
) => unknown;

function MasterRegistry(): MasterRegistry {
	return {
		pingAt: 0,
		record: {},
	};
}

const file = ref<File | null>(null);
const node = ref<NodeState>({ id: crypto.randomUUID(), beacon: null });
const peer = useNetwork({ type: 'node', id: node.value.id });
const slaveRecord = ref<Record<string, SlaveAbstract>>({});
const slavePingAt = ref(0);
const Master = ref<MasterRegistry>(MasterRegistry());

const networkSearchList = computed<({ id: string } & SearchItem)[]>(() => {
	const { searchRecord } = network.value;

	return Object.entries(searchRecord).map(([id, item]) => ({ id, ...item }));
});

const downtime = computed(() => {
	const duration = localTime.value - network.value.at;

	return duration > 10000 ? 'Timeout' : duration;
});

watch(file, async (file) => {
	if (file === null) {
		return;
	}

	const configuration = JSON.parse(await file.text());

	Object.assign(networkConfiguration.value, configuration);
});

peer.node.addEventListener('data-seek', function pingSlave() {
	const now = Date.now();

	if (now - slavePingAt.value < 1000) {
		return;
	}

	const PING_MESSAGE = JSON.stringify({ action: 'ping' });

	for (const slaveId of Object.keys(slaveRecord.value)) {
		peer.send({ type: 'slave', id: slaveId }, PING_MESSAGE);
	}

	slavePingAt.value = Date.now();
});

peer.node.addEventListener('data-seek', function pingMaster() {
	const now = Date.now();

	if (now - Master.value.pingAt < 1000) {
		return;
	}

	const PING_MESSAGE = JSON.stringify({ action: 'ping' });

	for (const masterId of Object.keys(Master.value.record)) {
		peer.send({ type: 'master', id: masterId }, PING_MESSAGE);
	}

	Master.value.pingAt = Date.now();
});

function createNodeBeacon() {
	destroyNodeBeacon();

	node.value.beacon = setInterval(() => {
		const BEACON_MESSAGE = JSON.stringify({
			action: 'node-beacon',
			networkId: network.value.id,
		});

		peer.broadcast(BEACON_MESSAGE);
	}, 1000);
}

function destroyNodeBeacon() {
	const { beacon } = node.value;

	if (beacon !== null) {
		clearInterval(beacon);
		node.value.beacon = null;
	}
}

const MessageHandler: Record<string, Record<string, MessageHandler>> = {
	node: {
		'network-beacon': ({ id, inquiry, race, commander }, source) => {
			network.value.searchRecord[id as string] = {
				at: Date.now(),
				node: source.id!,
				inquiry: inquiry as boolean,
				race: race as boolean,
				commander: commander as number,
			};

			if (id === network.value.id) {
				network.value.configuration.inquiry = inquiry as boolean;
				network.value.configuration.race = race as boolean;
				network.value.configuration.commander = commander as number;
			}
		},
		'network-join-request': (_, source) => {
			network.value.topology.secondaries[source.id!] = Date.now();
		},
		'network-primary-sync': ({ topology, id }) => {
			network.value.at = Date.now();
			network.value.id = id as string;
			network.value.topology = topology as NetworkTopology;
		},
		'slave-sync-to-primary': (incomingMessage, source) => {
			const { primary, secondaries } = network.value.topology;

			const message = JSON.stringify({
				action: 'slave-sync-broadcast',
				...incomingMessage,
			});

			for (const nodeId of [primary, ...Object.keys(secondaries)]) {
				if (nodeId === node.value.id) {
					MessageHandler.node!['slave-sync-broadcast']!(
						incomingMessage,
						source,
					);
				} else {
					peer.send({ id: nodeId, type: 'node' }, message);
				}
			}
		},
		// To all master
		'slave-sync-broadcast': (incomingMessage) => {
			const message = JSON.stringify({
				action: 'slave-sync-incoming',
				...incomingMessage,
			});

			for (const [masterId] of Object.entries(Master.value.record)) {
				peer.send({ type: 'master', id: masterId }, message);
			}
		},
	},
	master: {
		bind: ({ commander }, source) => {
			Master.value.record[source.id!] = {
				at: Date.now(),
				commander: commander as boolean,
			};
		},
		ping: ({ commander }, source) => {
			Master.value.record[source.id!] = {
				at: Date.now(),
				commander: commander as boolean,
			};
		},
	},
	slave: {
		bind: (_, source) => {
			slaveRecord.value[source.id!] = { at: Date.now() };
		},
		ping: (_, source) => {
			slaveRecord.value[source.id!] = { at: Date.now() };
		},
		sync: ({ masterList }, source) => {
			const messageObject = {
				slaveId: source.id,
				masterList,
			};

			if (isPrimary.value) {
				MessageHandler.node!['slave-sync-to-primary']!(messageObject, source);
			} else {
				const message = JSON.stringify({
					action: 'slave-sync-to-primary',
					...messageObject,
				});

				peer.send(
					{
						type: 'node',
						id: network.value.topology.primary,
					},
					message,
				);
			}
		},
	},
};

peer.node.addEventListener('message', ({ source, message }) => {
	const { type } = source;
	const { action, ...body } = JSON.parse(message);
	const handler = MessageHandler[type!]?.[action as string];

	if (handler !== undefined) {
		handler(body, source);
	}
});

peer.node.addEventListener('data-seek', function clearTimeoutSlave() {
	for (const [id, { at }] of Object.entries(slaveRecord.value)) {
		if (localTime.value - at > 10000) {
			delete slaveRecord.value[id];
		}
	}
});

let primarySyncedAt = 0;

peer.node.addEventListener('data-seek', async function sync() {
	if (!isPrimary.value) {
		return;
	}

	const now = Date.now();

	if (now - primarySyncedAt < 1000) {
		return;
	}

	network.value.at = now;

	const { topology, id } = network.value;

	for (const nodeId in topology.secondaries) {
		await peer.send(
			{
				type: 'node',
				id: nodeId,
			},
			JSON.stringify({
				action: 'network-primary-sync',
				id,
				topology,
			}),
		);
	}

	primarySyncedAt = now;
});

const MAX_DOWNTIME = 10000;

peer.node.addEventListener('data-seek', async function succeed() {
	const { id: networkId, at, topology } = network.value;
	const { id: nodeId } = node.value;

	if (networkId === null) {
		return;
	}

	if (isPrimary.value) {
		return;
	}

	if (localTime.value - at < MAX_DOWNTIME) {
		return;
	}

	const top = Object.keys(topology.secondaries).sort()[0];

	if (top === nodeId) {
		topology.primary = nodeId;
		delete topology.secondaries[nodeId];
		createNetworkBeacon();
	}
});

const networkConfiguration = ref<NetworkConfiguration>({
	inquiry: false,
	race: false,
	commander: 0,
	protocolList: [],
	instructionList: [],
});

function NetworkState(): NetworkState {
	return {
		id: null,
		beacon: null,
		configuration: {
			inquiry: false,
			race: false,
			commander: 0,
			protocolList: [],
			instructionList: [],
		},
		searchRecord: {},
		topology: {
			primary: null,
			secondaries: {},
		},
		at: 0,
	};
}

const network = ref<NetworkState>(NetworkState());

const isPrimary = computed(() => {
	return node.value.id === network.value.topology.primary;
});

function destroyNetwork() {
	destroyNetworkBeacon();
	network.value = NetworkState();
}

function destroyNetworkBeacon() {
	const { beacon } = network.value;

	if (beacon !== null) {
		clearInterval(beacon);
	}
}

function createNetworkBeacon() {
	destroyNetworkBeacon();

	network.value.beacon = setInterval(() => {
		const {
			id,
			configuration: { inquiry, race, commander },
		} = network.value;

		const BEACON_MESSAGE = JSON.stringify({
			action: 'network-beacon',
			id,
			inquiry,
			race,
			commander,
		});

		peer.broadcast(BEACON_MESSAGE).catch(() => {});
	}, 1000);
}

function updateNetwork() {
	destroyNetwork();

	Object.assign(network.value, {
		id: crypto.randomUUID(),
		configuration: {
			...networkConfiguration.value,
		},
		topology: {
			primary: node.value.id,
			secondaries: {},
		},
	});

	createNetworkBeacon();
}

const localTime = ref<number>(Date.now());

peer.node.addEventListener('data-seek', () => {
	const now = Date.now();

	localTime.value = now;

	for (const [id, item] of Object.entries(network.value.searchRecord)) {
		if (now - item.at > 10000) {
			delete network.value.searchRecord[id];
		}
	}
});

async function joinNetworkByNodeId(nodeId: string) {
	await peer.send(
		{
			type: 'node',
			id: nodeId,
		},
		JSON.stringify({
			action: 'network-join-request',
		}),
	);
}

onMounted(() => {
	peer.open();
	createNodeBeacon();
});

onBeforeUnmount(() => {
	destroyNetwork();
	destroyNodeBeacon();
	peer.close();
});

defineOptions({ name: 'AppControllerScopeMainVirtualNode' });
</script>
