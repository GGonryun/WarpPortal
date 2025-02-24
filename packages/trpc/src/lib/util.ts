import { createTRPCReact } from '@trpc/react-query';
import { AppRouter } from './types';

export const trpc = createTRPCReact<AppRouter>();
