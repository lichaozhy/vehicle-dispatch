import type { InjectionKey, Ref } from 'vue';

type TitleSetter = (value: string) => unknown;

export interface User {
	name: string;
	isCommander: boolean;
}

export const SET_TITLE = Symbol('TitleSetter') as InjectionKey<TitleSetter>;
export const MASTER_USER = Symbol('MasterUser') as InjectionKey<Ref<User | null>>;
