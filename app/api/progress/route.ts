import { openProgressStore } from 'paceprep:progress-store';
import { createProgressHandlers } from '@/server/progress-api';

export const dynamic = 'force-dynamic';
const handlers = createProgressHandlers(openProgressStore);
export const GET = (request: Request) => handlers.GET(request);
export const PUT = (request: Request) => handlers.PUT(request);
export const DELETE = (request: Request) => handlers.DELETE(request);
