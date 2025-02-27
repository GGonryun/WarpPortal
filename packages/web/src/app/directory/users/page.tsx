import { UsersList, CreateUser } from '@/components/users';
import { Stack, Typography } from '@mui/material';

export default async function Page() {
  return (
    <Stack spacing={1}>
      <Typography variant="h2">Users</Typography>
      <UsersList />
      <CreateUser />
    </Stack>
  );
}
