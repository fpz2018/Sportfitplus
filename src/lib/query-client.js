import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000,   // 5 minuten — voorkom onnodige refetches bij navigatie
			gcTime: 10 * 60 * 1000,      // 10 minuten — cache langer bewaren
		},
	},
});