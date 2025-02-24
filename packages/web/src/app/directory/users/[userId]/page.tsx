import { UserAttributes } from '@/components/users/attributes';
import { UserInfo } from '@/components/users/info';
import { ArrowBack } from '@mui/icons-material';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';

export default async function Page(props: {
  params: Promise<{ userId: string }>;
}) {
  const userId = Number((await props.params).userId);

  return (
    <Stack spacing={2}>
      <Typography variant="h3">User ID: {userId}</Typography>
      <Box>
        <Button
          href="/directory/users"
          variant="contained"
          color="primary"
          startIcon={<ArrowBack />}
        >
          All Users
        </Button>
      </Box>
      <Divider />
      <Typography variant="h4">Info</Typography>
      <UserInfo userId={userId} />
      <Divider />
      <Typography variant="h4">Attributes</Typography>
      <UserAttributes userId={userId} />
    </Stack>
  );
}
