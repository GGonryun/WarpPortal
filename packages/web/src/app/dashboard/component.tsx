'use client';

import { Stack } from '@mui/material';
import { trpc } from '@warpportal/trpc/client';

export const DashboardComponent = () => {
  const user = trpc.user.useQuery();
  if (user.isPending) {
    return <div>Loading...</div>;
  }
  if (user.isError) {
    return <div>Error</div>;
  }

  return (
    <Stack gap={1}>
      <div>{user.data.id}</div>
      <div>{user.data.email}</div>
    </Stack>
  );
};
