import { Typography } from '@mui/material';
import { DashboardComponent } from './component';
import { HydrateClient } from '@warpportal/trpc/server';

export default async function Page() {
  return (
    <HydrateClient>
      <Typography variant="h1">Dashboard</Typography>
      <DashboardComponent />
    </HydrateClient>
  );
}
