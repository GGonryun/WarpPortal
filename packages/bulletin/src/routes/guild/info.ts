import { Router } from 'express';
import { PolicyAction, prisma } from '@warpportal/prisma';

export const infoRouter: Router = Router({ mergeParams: true });

const DENY_RESPONSE = {
  action: 'DENY',
  hash: -1,
  name: '',
};

infoRouter.get('/', async (req, res) => {
  const { local, destination } = req.query;
  if (!local || !destination) {
    console.error('Cannot provide info: missing local or destination');
    return res.json(DENY_RESPONSE);
  }

  const user = await prisma.user.findFirst({
    where: {
      local: local as string,
    },
  });
  if (!user) {
    return res.json(DENY_RESPONSE);
  }

  const server = await prisma.destination.findFirst({
    where: {
      hostname: destination as string,
    },
  });
  if (!server) {
    return res.json(DENY_RESPONSE);
  }

  const policies = await prisma.policy.findMany({
    where: {
      userId: user.id,
      destinationId: server.id,
    },
  });

  if (!policies.length) {
    return res.json(DENY_RESPONSE);
  }

  if (policies.some((policy) => policy.action === 'DENY')) {
    return res.json(DENY_RESPONSE);
  }

  const sudo = policies.find((policy) => PolicyAction.SUDO === policy.action);
  if (sudo) {
    return res.json({
      action: 'SUDO',
      hash: user.hash,
      name: user.name,
    });
  }

  const allow = policies.find((policy) => PolicyAction.ALLOW === policy.action);
  if (allow) {
    return res.json({
      action: 'ALLOW',
      hash: user.hash,
      name: user.name,
    });
  }

  return res.send(403).json({
    message: 'Invalid policy actions found',
  });
});
