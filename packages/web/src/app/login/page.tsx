import { Login } from '@mui/icons-material';
import { Box, Button, Stack } from '@mui/material';
import Image from 'next/image';

export default async function Page() {
  return (
    <Box
      sx={{
        height: '100vh',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Stack spacing={4} alignItems="center">
        <Image
          src="/logo/okta.png"
          alt="Okta Logo"
          width={512 / 2}
          height={169 / 2}
        />
        <Box>
          <Button
            href="/dashboard"
            variant="contained"
            color="primary"
            startIcon={<Login />}
          >
            Continue with Okta
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
