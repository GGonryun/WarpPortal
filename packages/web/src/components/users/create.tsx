'use client';

import { Add } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ShellSchema } from '@warpportal/shared';
import { trpc } from '@warpportal/trpc/client';
import { useState } from 'react';
import { ShellSelect } from './fields';

export const CreateUser = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Create User
        </Button>
      </Box>
      <CreateUserDialog open={open} setOpen={setOpen} />
    </>
  );
};

const CreateUserDialog: React.FC<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const util = trpc.useUtils();
  const invalidateUsers = () => util.users.invalidate();
  const createUser = trpc.users.create.useMutation();

  const defaultShell = '/bin/bash';

  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [shell, setShell] = useState<ShellSchema>(defaultShell);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleClose = () => {
    setOpen(false);
    setEmail('');
    setName('');
    setShell(defaultShell);
    setError(undefined);
  };

  const handleCancel = () => {
    if (email || name) {
      if (!confirm('You have unsaved changes')) return;
    }
    handleClose();
  };

  const handleSave = () => {
    const payload = { email, name, shell };
    createUser.mutate(payload, {
      onSuccess: () => {
        invalidateUsers();
        handleClose();
      },
      onError: (error) => {
        setError(error.message);
      },
    });
  };

  const handleUpdateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    setEmail(e.target.value);
  };

  const handleUpdateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    setName(e.target.value);
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle>Create User</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Email" value={email} onChange={handleUpdateEmail} />
          <TextField label="Name" value={name} onChange={handleUpdateName} />
          <ShellSelect defaultShell={shell} shell={shell} setShell={setShell} />
          <Typography color="error">{error}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!!error || !name || !email}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
