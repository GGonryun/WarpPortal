'use client';
import { trpc } from '@warpportal/trpc/client';

export const DashboardComponent = () => {
  const { data } = trpc.sayHello.useQuery();
  return <div>{data?.greeting ?? 'N/A'}</div>;
};
