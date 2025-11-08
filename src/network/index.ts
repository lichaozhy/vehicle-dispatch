interface Address {
	type: 'master' | 'slave' | 'node' | null;
	id: string | null;
}

const DATA_LIFETIME = 10000;

function writeNetwork(source: Address, target: Address | null, payload: string) {
	const now = Date.now();

	const body = JSON.stringify({
		source,
		target,
		payload,
	});

	localStorage.setItem(`${now}`, body);
}

interface NetworkData {
	at: number;
	source: Address;
	target: Address | null;
	payload: string;
}

function* networkData(since: number): Generator<NetworkData, void, unknown> {
	const length = localStorage.length;
	const removing = [];
	const expiredAt = since - DATA_LIFETIME;
	const keyList: string[] = [];

	for (let index = 0; index < length; index++) {
		const key = localStorage.key(index);

		if (key === null) {
			break;
		}

		keyList.push(key);
	}

	for (const key of keyList) {
		const at = Number(key);

		if (isNaN(at) || !Number.isInteger(at)) {
			continue;
		}

		if (at < since) {
			if (at < expiredAt) {
				removing.push(key);
			}

			continue;
		}

		const body = localStorage.getItem(key);

		if (body === null) {
			removing.push(key);
			continue;
		}

		yield { at, ...JSON.parse(body) };
	}

	for (const key of removing) {
		localStorage.removeItem(key);
	}
}

class NetworkMessageEvent extends Event {
	source: Address;
	message: string;
	at: number = 0;

	constructor(at: number, source: Address, message: string) {
		super('message');

		this.at = at;
		this.source = source;
		this.message = message;
	}
}

export function useNetwork(local: Address) {
	const node = new EventTarget() as EventTarget & {
		addEventListener(
			type: 'message',
			listener: (event: NetworkMessageEvent) => unknown,
		): void;
	};

	const state = {
		active: false,
		consumedAt: 0,
	};

	function open() {
		state.active = true;
		state.consumedAt = Date.now();

		requestAnimationFrame(function consumeNetworkData() {
			const now = Date.now();

			for (const data of networkData(state.consumedAt)) {
				const { at, source, target, payload } = data;
				const fromLocal = source.id === local.id;
				const isBroadcast = target === null;
				const toLocal = !isBroadcast && target.id === local.id;

				if (fromLocal || (!isBroadcast && !toLocal)) {
					continue;
				}

				const event = new NetworkMessageEvent(at, source, payload);

				node.dispatchEvent(event);
			}

			state.consumedAt = now;

			if (state.active) {
				requestAnimationFrame(consumeNetworkData);
			}
		});
	}

	function close() {
		state.active = false;
	}

	async function broadcast(message: string) {
		writeNetwork(local, null, message);
	}

	async function send(target: Address, message: string) {
		writeNetwork(local, target, message);
	}

	return { node, open, close, send, broadcast };
}
