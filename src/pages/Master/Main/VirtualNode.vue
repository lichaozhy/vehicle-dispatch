<template>
	<div>
		<div class="text-h5">
			Virtual Node
			<q-badge
				align="top"
				:color="isPrimary ? 'primary' : 'secondary'"
				>{{ isPrimary ? 'Primary' : 'Secondary' }}</q-badge
			>
		</div>

		<q-card
			class="q-mt-sm"
			flat
			bordered
		>
			<q-card-section class="q-pb-none">
				<div class="text-h6">Node</div>
			</q-card-section>
			<q-card-section>
				<q-input
					v-model="node.id"
					readonly
					label="Node ID"
					stack-label
					dense
				></q-input>
			</q-card-section>
		</q-card>

		<q-card
			class="q-mt-sm"
			flat
			bordered
		>
			<q-card-section class="q-pb-none">
				<div class="text-h6">Current Network</div>
			</q-card-section>
			<q-card-section class="q-pb-none">
				<q-form @submit.prevent="updateNetwork">
					<div class="row q-col-gutter-xs">
						<div class="col-12">
							<q-input
								v-model="network.id"
								readonly
								label="Network ID"
								stack-label
								dense
							></q-input>
						</div>
						<div class="col-3">
							<q-select
								label="Inquiry Mode"
								dense
								readonly
								v-model="networkConfiguration.inquiry"
							></q-select>
						</div>
						<div class="col-3">
							<q-select
								label="Race Mode"
								dense
								readonly
								v-model="networkConfiguration.race"
							></q-select>
						</div>
						<div class="col-3">
							<q-input
								label="Commander"
								dense
								readonly
								stack-label
								type="number"
								v-model="networkConfiguration.commander"
							></q-input>
						</div>
						<div class="col-3">
							<q-input
								label="Downtime"
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
							label="Destroy"
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
				<div class="text-h6">Create & Configurate Network from Local</div>
			</q-card-section>
			<q-card-section class="q-pb-none">
				<q-form @submit.prevent="updateNetwork">
					<div class="row q-col-gutter-xs">
						<div class="col-4">
							<q-select
								label="Inquiry Mode"
								dense
								v-model="networkConfiguration.inquiry"
							></q-select>
						</div>
						<div class="col-4">
							<q-select
								label="Race Mode"
								dense
								v-model="networkConfiguration.race"
							></q-select>
						</div>
						<div class="col-4">
							<q-input
								label="Commander"
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
							label="Update"
							icon="refresh"
							color="primary"
							type="submit"
						></q-btn>
						<q-space></q-space>
						<q-btn
							label="Import"
							icon="file_download"
							color="indigo-10"
						></q-btn>
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
				<div class="text-h6">Searching...</div>
			</q-card-section>

			<q-card-section>
				<q-list
					bordered
					separator
				>
					<q-item v-if="networkSearchList.length === 0">
						<q-item-section> No network </q-item-section>
					</q-item>
					<q-item
						v-for="item in networkSearchList"
						:key="item.id"
					>
						<q-item-section>
							<q-item-label>Network Id: {{ item.id }}</q-item-label>
							<q-item-label caption>
								<q-badge
									v-if="item.inquiry"
									color="primary"
									>inquiry</q-badge
								>
								<q-badge
									v-if="item.race"
									color="negative"
									>race</q-badge
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
								label="Join"
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
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
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

interface MasterState {
	id: string | null;
}

const node = ref<MasterState>({
	id: crypto.randomUUID(),
});

const peer = useNetwork({ type: 'node', id: node.value.id });

type MessageHandler = (
	body: { [key: string]: unknown },
	source: Address,
) => unknown;

const networkSearchList = computed<({ id: string } & SearchItem)[]>(() => {
	const { searchRecord, id: currentId } = network.value;

	return Object.entries(searchRecord)
		.filter(([id]) => id !== currentId)
		.map(([id, item]) => ({ id, ...item }));
});

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
		},
		'network-join-request': (_, source) => {
			network.value.topology.secondaries[source.id!] = Date.now();
		},
		'network-primary-sync': ({ topology, id }) => {
			network.value.at = Date.now();
			network.value.id = id as string;
			network.value.topology = topology as NetworkTopology;
		},
	},
	master: {},
	slave: {},
};

const downtime = computed(() => {
	const duration = localTime.value - network.value.at;

	return duration > 10000 ? 'Timeout' : duration;
});

peer.node.addEventListener('message', ({ source, message }) => {
	const { type } = source;
	const { action, ...body } = JSON.parse(message);
	const handler = MessageHandler[type!]?.[action as string];

	if (handler !== undefined) {
		handler(body, source);
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
				id, topology,
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
		createBeacon();
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
	destroyBeacon();
	network.value = NetworkState();
}

function destroyBeacon() {
	const { beacon } = network.value;

	if (beacon !== null) {
		clearInterval(beacon);
	}
}

function createBeacon() {
	destroyBeacon();

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
		topology: {
			primary: node.value.id,
			secondaries: {},
		},
	});

	createBeacon();
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
});

onBeforeUnmount(() => {
	destroyNetwork();
	peer.close();
});

defineOptions({ name: 'AppControllerScopeMainVirtualNode' });
</script>
