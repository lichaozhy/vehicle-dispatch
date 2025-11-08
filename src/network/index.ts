interface Address {
	type: 'controller' | 'vehicle' | null;
	id: string | null;
}

const BROADCAST_TARGET: Readonly<Address> = Object.freeze({
	type: null,
	id: null,
});

const DATA_LIFETIME = 10000;

function writeNetwork(source: Address, target: Address, payload: string) {
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
	target: Address;
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
		super('mesaage');

		this.at = at;
		this.source = source;
		this.message = message;
	}
}

export function useNetwork(localAddress: Address) {
	const node = new EventTarget() as EventTarget & {
		addEventListener(
			type: 'message',
			listener: (event: NetworkMessageEvent) => unknown,
		): void;
	};

	const connection = {
		active: false,
		consumedAt: 0,
	};

	function connect() {
		connection.active = true;
		connection.consumedAt = Date.now();

		requestAnimationFrame(function consumeNetworkData() {
			const now = Date.now();

			for (const data of networkData(connection.consumedAt)) {
				const { at, source, target, payload } = data;

				if (
					target.type !== localAddress.type &&
					target.id !== localAddress.id
				) {
					continue;
				}

				const event = new NetworkMessageEvent(at, source, payload);

				node.dispatchEvent(event);
			}

			connection.consumedAt = now;

			if (connection.active) {
				requestAnimationFrame(consumeNetworkData);
			}
		});
	}

	function disconnnet() {
		connection.active = false;
	}

	async function broadcast(message: string) {
		writeNetwork(localAddress, BROADCAST_TARGET, message);
	}

	async function send(target: Address, message: string) {
		writeNetwork(localAddress, target, message);
	}

	return { node, connect, disconnnet, send, broadcast };
}
