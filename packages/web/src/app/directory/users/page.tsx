import { UsersList } from '@/components/users/list';
import { Stack, Typography } from '@mui/material';

export default async function Page() {
  return (
    <Stack spacing={1}>
      <Typography variant="h2">Users</Typography>
      <UsersList />
    </Stack>
  );
}
