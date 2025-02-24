import { Button, Stack, Typography } from '@mui/material';

export default function Page() {
  return (
    <Stack spacing={1}>
      <Typography variant="h2">Directory</Typography>
      <Stack direction="row" spacing={2}>
        <Button href="/directory/users" variant="contained" color="primary">
          Users
        </Button>
        <Button href="/directory/groups" variant="contained" color="primary">
          Groups
        </Button>
      </Stack>
    </Stack>
  );
}
