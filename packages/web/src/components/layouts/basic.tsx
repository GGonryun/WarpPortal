import { Stack, Button, Container, Divider, Box } from '@mui/material';
import React from 'react';

export const BasicLayout: React.FC<{
  children: React.ReactNode[] | React.ReactNode;
}> = ({ children }) => {
  return (
    <Container>
      <Stack spacing={1} mt={2}>
        <Stack direction="row" spacing={1}>
          <Button href="/dashboard" variant="contained">
            Dashboard
          </Button>
          <Button href="/directory" variant="contained">
            Directory
          </Button>
          <Button href="/inventory" variant="contained">
            Inventory
          </Button>
          <Button href="/roles" variant="contained">
            Roles
          </Button>
          <Button href="/policies" variant="contained">
            Policies
          </Button>
        </Stack>
        <Divider />
      </Stack>
      <Box mt={2}>{children}</Box>
    </Container>
  );
};
