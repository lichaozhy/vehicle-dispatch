import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
	{
		name: 'app',
		path: '/',
		component: () => import('layouts/MainLayout.vue'),
		children: [
			{ path: '', component: () => import('pages/IndexPage.vue') },
			{
				name: 'app.vehicle',
				path: 'vehicle',
				component: () => import('pages/Vehicle/Page.vue'),
				children: [
					{
						name: 'app.vehicle.authentication',
						path: 'authentication',
						component: () => import('pages/Vehicle/Authentication/Page.vue'),
					},
					{
						name: 'app.vehicle.main',
						path: '',
						component: () => import('pages/Vehicle/Main/Page.vue'),
					},
				],
			},
			{
				name: 'app.controller',
				path: 'controller',
				component: () => import('pages/Controller/Page.vue'),
				children: [
					{
						name: 'app.controller.authentication',
						path: 'authentication',
						component: () => import('pages/Controller/Authentication/Page.vue'),
					},
					{
						name: 'app.controller.main',
						path: '',
						component: () => import('pages/Controller/Main/Page.vue'),
					},
				],
			},
		],
	},

	// Always leave this as last one,
	// but you can also remove it
	{
		path: '/:catchAll(.*)*',
		component: () => import('pages/ErrorNotFound.vue'),
	},
];

export default routes;
