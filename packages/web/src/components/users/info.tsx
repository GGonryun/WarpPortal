'use client';

import { Stack, TextField, Box, Button } from '@mui/material';
import { Loading } from '../loading';
import { trpc } from '@warpportal/trpc/client';
import { Failure } from '../failures';
import { useEffect, useState } from 'react';
import { HourglassBottom, Save } from '@mui/icons-material';

export const UserInfo: React.FC<{ userId: number }> = ({ userId }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const user = trpc.users.get.useQuery({ id: userId });
  const updateUser = trpc.users.update.useMutation();

  useEffect(() => {
    setEmail(user.data?.email ?? '');
  }, [user.data?.email]);

  useEffect(() => {
    setName(user.data?.name ?? '');
  }, [user.data?.name]);

  if (user.isPending) return <Loading />;
  if (user.isError) return <Failure />;

  return (
    <Stack spacing={1}>
      <Stack spacing={2}>
        <TextField
          label="Email"
          value={email}
          helperText="What's your email address?"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <TextField
          label="Name"
          helperText="What should we call you?"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </Stack>
      <Box>
        <Button
          variant="contained"
          startIcon={updateUser.isPending ? <HourglassBottom /> : <Save />}
          onClick={async () => {
            updateUser.mutate({ id: Number(userId), email, name });
          }}
          disabled={updateUser.isPending}
        >
          {updateUser.isPending ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Stack>
  );
};
