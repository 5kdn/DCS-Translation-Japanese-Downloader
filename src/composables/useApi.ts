import { hc } from 'hono/client';
import type { AppType } from '@/types/server';

const client = hc<AppType>(import.meta.env.VITE_API_BASE_URL);

export const useApi = () => client;
