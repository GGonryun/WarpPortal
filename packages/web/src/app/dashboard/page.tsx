import { Box, Typography } from '@mui/material';
import { DashboardComponent } from './component';

export default function Page() {
  return (
    <Box>
      <Typography variant="h1">Dashboard</Typography>
      <DashboardComponent />
    </Box>
  );
}
