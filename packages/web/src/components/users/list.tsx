'use client';

import { Person } from '@mui/icons-material';
import {
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { trpc } from '@warpportal/trpc/client';
import { Loading } from '../loading';

export const UsersList = () => {
  const users = trpc.users.list.useQuery();

  if (users.isPending) return <Loading />;

  return (
    <List>
      {users.data?.map((user, index) => (
        <ListItemButton
          key={user.id}
          component={Link}
          href={`/directory/users/${user.id}`}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            },
            backgroundColor:
              index % 2 === 0 ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          }}
        >
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          <ListItemText>
            {index + 1}. {user.email} ({user.name})
          </ListItemText>
        </ListItemButton>
      ))}
    </List>
  );
};
