'use client';

import { AddCircleOutline, Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { trpc, RouterOutput } from '@warpportal/trpc/client';
import React, { useEffect, useState } from 'react';

type UserAttribute = RouterOutput['users']['attributes']['list'][number];
type EditableAttribute = Partial<Omit<UserAttribute, 'userId'>>;

export const UserAttributes: React.FC<{ userId: number }> = ({ userId }) => {
  const attributes = trpc.users.attributes.list.useQuery({
    userId: userId,
  });
  const [edit, setEdit] = useState<EditableAttribute | undefined>(undefined);
  const [destroy, setDestroy] = useState<UserAttribute | undefined>(undefined);
  return (
    <>
      <Stack gap={1} direction="row" flexWrap="wrap">
        {attributes.data?.map((attribute) => (
          <Chip
            key={attribute.id}
            color="primary"
            icon={<Edit fontSize="small" />}
            label={`${attribute.key} :: ${attribute.value}`}
            onClick={() => {
              console.log('setting', attribute);
              setEdit(attribute);
            }}
            onDelete={() => {
              setDestroy(attribute);
            }}
          />
        ))}
        <Chip
          key={'create'}
          color="success"
          label="Create New"
          icon={<AddCircleOutline />}
          onClick={() => setEdit({})}
        />
      </Stack>
      <EditUserAttributeDialog
        userId={userId}
        attribute={edit}
        setEdit={setEdit}
      />
      <DeleteUserAttributeDialog attribute={destroy} setDestroy={setDestroy} />
    </>
  );
};

const EditUserAttributeDialog: React.FC<{
  userId: number;
  attribute: EditableAttribute | undefined;
  setEdit: React.Dispatch<React.SetStateAction<EditableAttribute | undefined>>;
}> = ({ userId, attribute, setEdit }) => {
  const util = trpc.useUtils();
  const invalidateAttributes = () => util.users.attributes.invalidate();
  const upsertAttribute = trpc.users.attributes.upsert.useMutation();

  const [key, setKey] = useState(attribute?.key ?? '');
  const [value, setValue] = useState(attribute?.value ?? '');
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (attribute?.key) {
      setKey(attribute.key);
    }
    if (attribute?.value) {
      setValue(attribute.value);
    }
  }, [attribute]);

  const handleClose = () => {
    setKey('');
    setValue('');
    setError(undefined);
    setEdit(undefined);
  };

  const handleCancel = () => {
    if (key || value) {
      if (attribute?.key !== key || attribute?.value !== value) {
        if (!confirm('You have unsaved changes')) return;
      }
    }
    handleClose();
  };

  const handleSave = () => {
    if (attribute?.key === key && attribute?.value === value) {
      handleClose();
      return;
    }

    upsertAttribute.mutate(
      {
        ...attribute,
        userId,
        key,
        value,
      },
      {
        onSuccess: () => {
          invalidateAttributes();
          handleClose();
        },
        onError: (error) => {
          setError(error.message);
        },
      }
    );
  };

  const handleUpdateKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    setKey(e.target.value);
  };

  const handleUpdateValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    setValue(e.target.value);
  };

  return (
    <Dialog
      open={Boolean(attribute)}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>Edit Attribute</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Key" value={key} onChange={handleUpdateKey} />
          <TextField label="Value" value={value} onChange={handleUpdateValue} />
          <Typography color="error">{error}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!!error || !key || !value}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteUserAttributeDialog: React.FC<{
  attribute: UserAttribute | undefined;
  setDestroy: React.Dispatch<React.SetStateAction<UserAttribute | undefined>>;
}> = ({ attribute, setDestroy }) => {
  return (
    <Dialog open={Boolean(attribute)} onClose={() => setDestroy(undefined)}>
      <Box>Destroying... {attribute?.id}</Box>
    </Dialog>
  );
};
