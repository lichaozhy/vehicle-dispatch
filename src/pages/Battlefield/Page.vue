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
						label="创建控制端"
						:to="{ name: 'app.master.authentication' }"
						target="_blank"
					></q-btn>
					<q-btn
						icon="toys"
						label="创建车辆"
						:to="{ name: 'app.slave.authentication' }"
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

inject(SET_TITLE)!('战场');
defineOptions({ name: 'AppBattlefieldPage' });
</script>
