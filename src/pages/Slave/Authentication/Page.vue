<template>
	<q-page
		class="column content-center"
		padding
	>
		<div class="full-width app-max-width">
			<q-form @submit="updateAndToMain">
				<q-toolbar>
					<q-space></q-space>
					<q-btn
						type="submit"
						color="primary"
						label="Authenticate"
					></q-btn>
					<q-space></q-space>
				</q-toolbar>
			</q-form>
		</div>
	</q-page>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { SET_TITLE } from 'src/Injection';
import { useRouter } from 'vue-router';

const router = useRouter();

async function updateAndToMain() {
	await router.push({
		name: 'app.slave.main',
	});
}

inject(SET_TITLE)!('Slave Authentication');
defineOptions({ name: 'AppVehicleScopeAuthenticationPage' });
</script>
