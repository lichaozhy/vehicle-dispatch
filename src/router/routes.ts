import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
	{
		name: 'app',
		path: '/',
		component: () => import('layouts/MainLayout.vue'),
		redirect: { name: 'app.battlefield' },
		children: [
			{
				name: 'app.battlefield',
				path: '/battlefield',
				component: () => import('pages/Battlefield/Page.vue'),
			},
			{
				name: 'app.slave',
				path: 'slave',
				component: () => import('pages/Slave/Page.vue'),
				redirect: { name: 'app.slave.authentication' },
				children: [
					{
						name: 'app.slave.authentication',
						path: 'authentication',
						component: () => import('pages/Slave/Authentication/Page.vue'),
					},
					{
						name: 'app.slave.main',
						path: '',
						component: () => import('pages/Slave/Main/Page.vue'),
					},
				],
			},
			{
				name: 'app.master',
				path: 'master',
				component: () => import('pages/Master/Page.vue'),
				redirect: { name: 'app.master.authentication' },
				children: [
					{
						name: 'app.master.authentication',
						path: 'authentication',
						component: () => import('pages/Master/Authentication/Page.vue'),
					},
					{
						name: 'app.master.main',
						path: '',
						component: () => import('pages/Master/Main/Page.vue'),
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
