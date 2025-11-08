<template>
	<div>
		<div class="text-h5">
			Virtual Node
			<q-badge
				align="top"
				:color="node.primary ? 'primary' : 'secondary'"
				>{{ node.primary ? 'Primary' : 'Secondary' }}</q-badge
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
						<div class="col-4">
							<q-select
								label="Inquiry Mode"
								dense
								readonly
								v-model="networkConfiguration.inquiry"
							></q-select>
						</div>
						<div class="col-4">
							<q-select
								label="Race Mode"
								dense
								readonly
								v-model="networkConfiguration.race"
							></q-select>
						</div>
						<div class="col-4">
							<q-input
								label="Commander"
								dense
								readonly
								stack-label
								type="number"
								v-model="networkConfiguration.commander"
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
				<div class="text-h6">Searching...</div>
				{{ network.searchRecord }}
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
	</div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useNetwork } from 'src/network';

interface NetworkConfiguration {
	inquiry: boolean;
	race: boolean;
	commander: number;
	protocolList: string[];
	instructionList: string[];
}

interface NetworkSearchItem {
	node: string;
	at: number;
}

interface NetworkState {
	id: null | string;
	beacon: ReturnType<typeof setInterval> | null;
	configuration: NetworkConfiguration;
	searchRecord: Record<string, NetworkSearchItem>;
}

interface MasterState {
	id: string | null;
	primary: boolean;
}

const node = ref<MasterState>({
	id: crypto.randomUUID(),
	primary: false,
});

const peer = useNetwork({ type: 'node', id: node.value.id });

type MessageHandler = (body: { [key: string]: unknown }) => unknown;

const MessageHandler: Record<string, Record<string, MessageHandler>> = {
	node: {
		'network-beacon': ({ id, node }) => {
			network.value.searchRecord[id as string] = {
				at: Date.now(),
				node: node as string,
			};
		},
	},
	master: {},
	slave: {},
};

peer.node.addEventListener('message', ({ source, message }) => {
	const { type } = source;
	const { action, ...body } = JSON.parse(message);
	const handler = MessageHandler[type!]?.[action as string];

	if (handler !== undefined) {
		handler(body);
	}
});

const networkConfiguration = ref<NetworkConfiguration>({
	inquiry: false,
	race: false,
	commander: 0,
	protocolList: [],
	instructionList: [],
});

const network = ref<NetworkState>({
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
});

function destroyNetwork() {
	const { beacon } = network.value;

	if (beacon !== null) {
		network.value.beacon = null;
		clearInterval(beacon);
	}

	network.value.id = null;
	node.value.primary = false;
}

function updateNetwork() {
	destroyNetwork();

	Object.assign(network.value, {
		id: crypto.randomUUID(),
		beacon: setInterval(() => {
			const { id } = network.value;
			const BEACON_MESSAGE = JSON.stringify({ action: 'network-beacon', id });

			peer.broadcast(BEACON_MESSAGE).catch(() => {});
		}, 1000),
	});

	node.value.primary = true;
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
