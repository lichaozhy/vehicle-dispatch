<template>
	<q-page
		class="column content-center"
		padding
	>
		<div class="full-width app-max-width">
			<q-form @submit="updateAndToMain">
				<q-input
					v-model="username"
					label="Username"
					autocomplete="off"
				/>

				<q-checkbox
					v-model="isCommander"
					label="As Commander"
				/>

				<q-toolbar>
					<q-space></q-space>
					<q-btn
						type="submit"
						color="primary"
						label="Authenticate"
						:disable="!isFormValid"
					></q-btn>
					<q-space></q-space>
				</q-toolbar>
			</q-form>
		</div>
	</q-page>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { MASTER_USER, SET_TITLE } from 'src/Injection';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref<string>('');
const isCommander = ref<boolean>(false);
const user = inject(MASTER_USER)!;

const isFormValid = computed(() => {
	return username.value.length > 2;
});

async function updateAndToMain() {
	user.value = {
		name: username.value,
		isCommander: isCommander.value,
	};

	await router.push({
		name: 'app.master.main',
	});
}

inject(SET_TITLE)!('Master Authentication');
defineOptions({ name: 'AppControllerScopeAuthenticationPage' });
</script>
