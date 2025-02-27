'use client';

import { StarOutline } from '@mui/icons-material';
import { Chip, Stack } from '@mui/material';
import { trpc } from '@warpportal/trpc/client';
import React from 'react';

export const UserAttributes: React.FC<{ userId: number }> = ({ userId }) => {
  const attributes = trpc.users.attributes.list.useQuery({
    userId: userId,
  });

  return (
    <>
      <Stack gap={1} direction="row" flexWrap="wrap">
        {attributes.data?.map((attribute) => (
          <Chip
            key={attribute.id}
            color="primary"
            icon={<StarOutline fontSize="small" />}
            label={`${attribute.key} :: ${attribute.value}`}
          />
        ))}
      </Stack>
    </>
  );
};
