'use client';

import { Stack, Typography } from '@mui/material';
import { Loading } from '../loading';
import { trpc } from '@warpportal/trpc/client';
import { Failure } from '../failures';

const Property: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => {
  return (
    <Stack spacing={1} direction="row">
      <Typography fontWeight={700}>{label}:</Typography>
      <Typography>{value}</Typography>
    </Stack>
  );
};

export const UserInfo: React.FC<{ userId: number }> = ({ userId }) => {
  const user = trpc.users.get.useQuery({ id: userId });

  if (user.isPending) return <Loading />;
  if (user.isError) return <Failure />;

  return (
    <Stack spacing={1}>
      <Stack spacing={2}>
        <Property label="Email" value={user.data.email} />
        <Property label="Name" value={user.data.name} />
        <Property label="Shell" value={user.data.shell} />
        <Property label="UID" value={user.data.hash} />
        <Property label="GID" value={user.data.hash} />
      </Stack>
    </Stack>
  );
};
