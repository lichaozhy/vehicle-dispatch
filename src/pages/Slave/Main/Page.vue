<template>
	<q-page
		class="column content-center"
		padding
	>
		<div class="full-width app-max-width">
			<div class="text-h5">车辆面板</div>
			<q-input
				v-model="id"
				readonly
				label="ID"
				dense
			></q-input>

			控制端：{{ Object.keys(Master.record) }}

			<q-card
				class="q-mt-sm"
				flat
				bordered
			>
				<q-card-actions class="q-pb-none">
					<div class="text-h5">链路</div>
				</q-card-actions>
				<q-card-actions>
					<div class="row q-col-gutter-xs full-width">
						<div class="col-9">
							<q-input
								:model-value="binding.node?.id"
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
						<q-item v-if="nodeList.length === 0">
							<q-item-section>没有节点</q-item-section>
						</q-item>
						<q-item
							v-for="node in nodeList"
							:key="node.id"
						>
							<q-item-section>
								<q-item-label>节点Id: {{ node.id }}</q-item-label>
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
									@click="requestBindNode(node.id)"
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
					<div class="text-h5">指令历史</div>
				</q-card-actions>
			</q-card>
		</div>
	</q-page>
</template>

<script setup lang="ts">
import type { Address } from 'src/network';
import { computed, onBeforeMount, ref, onBeforeUnmount, inject } from 'vue';
import { useNetwork } from 'src/network';
import { SET_TITLE } from 'src/Injection';

interface NodeBeaconAbstract {
	networkId: string | null;
	at: number;
}

interface BindingAbstract {
	id: string | null;
	at: number;
}

interface BindingRegistry {
	pingAt: number;
	node: BindingAbstract;
}

interface SyncRegistry {
	at: number;
}

interface MasterAbstract {
	at: number;
}

interface MasterRegistry {
	record: Record<string, MasterAbstract>;
}

function BindingRegistry() {
	return {
		pingAt: 0,
		node: {
			id: null,
			at: 0,
		},
	};
}

function SyncRegistry(): SyncRegistry {
	return {
		at: 0,
	};
}

function MasterRegistry(): MasterRegistry {
	return {
		record: {},
	};
}

const id = ref<string>(crypto.randomUUID());
const peer = useNetwork({ type: 'slave', id: id.value });
const nodeRecord = ref<Record<string, NodeBeaconAbstract>>({});
const localTime = ref<number>(0);
const binding = ref<BindingRegistry>(BindingRegistry());
const Sync = ref<SyncRegistry>(SyncRegistry());
const Master = ref<MasterRegistry>(MasterRegistry());

const bindingDowntime = computed(() => {
	const duration = localTime.value - binding.value.node.at;

	return duration > 10000 ? 'Timeout' : duration;
});

const nodeList = computed(() => {
	return Object.entries(nodeRecord.value).map(([id, abstract]) => {
		return { id, ...abstract };
	});
});

function requestBindNode(nodeId: string) {
	peer.send(
		{
			type: 'node',
			id: nodeId,
		},
		JSON.stringify({ action: 'bind' }),
	);
}

type MessageHandler = (
	body: { [key: string]: unknown },
	source: Address,
) => unknown;

const MessageHandler: Record<string, Record<string, MessageHandler>> = {
	node: {
		'node-beacon': ({ networkId }, source) => {
			nodeRecord.value[source.id!] = {
				networkId: networkId as string,
				at: Date.now(),
			};
		},
		ping: (_, source) => {
			binding.value.node = { at: Date.now(), id: source.id! };
		},
	},
	master: {
		assign: ({ master }) => {
			Master.value.record = {
				[master as string]: {
					at: Date.now(),
				},
			};
		},
		ping: (_, source) => {
			const abstract = Master.value.record[source.id!];

			if (abstract) {
				abstract.at = Date.now();
			}
		},
	},
	slave: {},
};

peer.node.addEventListener('message', ({ source, message }) => {
	const { type } = source;
	const { action, ...body } = JSON.parse(message);
	const handler = MessageHandler[type!]?.[action as string];

	if (handler !== undefined) {
		handler(body, source);
	}
});

peer.node.addEventListener('data-seek', () => (localTime.value = Date.now()));

peer.node.addEventListener('data-seek', () => {
	for (const [id, { at }] of Object.entries(nodeRecord.value)) {
		if (localTime.value - at > 10000) {
			delete nodeRecord.value[id];
		}
	}
});

peer.node.addEventListener('data-seek', function releaseTimeoutBinding() {
	if (localTime.value - binding.value.node.at > 10000) {
		binding.value = BindingRegistry();
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

	peer.send({ type: 'node', id: node.id }, '{"action": "ping"}');
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
		masterList: Object.keys(Master.value.record),
	});

	peer.send({ type: 'node', id: node.id }, message);
	Sync.value.at = Date.now();
});

onBeforeMount(() => {
	peer.open();
});

onBeforeUnmount(() => {
	peer.close();
});

inject(SET_TITLE)!('车辆端');
defineOptions({ name: 'AppVehicleScopeMainPage' });
</script>
