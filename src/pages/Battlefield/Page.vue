<template>
	<q-page
		class="column content-center"
		padding
	>
		<div class="full-width app-max-width">
			<q-card>
				<q-card-actions>
					<q-btn
						icon="sports_esports"
						label="New Master"
						:to="{ name: 'app.master' }"
						target="_blank"
					></q-btn>
					<q-btn
						icon="toys"
						label="New Slave"
						:to="{ name: 'app.slave' }"
						target="_blank"
					></q-btn>
				</q-card-actions>
			</q-card>
		</div>
	</q-page>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { SET_TITLE } from 'src/Injection';

inject(SET_TITLE)!('Battlefield');
defineOptions({ name: 'AppBattlefieldPage' });
</script>
