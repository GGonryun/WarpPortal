import { Router } from 'express';
import { PolicyAction, prisma } from '@warpportal/prisma';

export const infoRouter: Router = Router({ mergeParams: true });

infoRouter.get('/', async (req, res) => {
  const { local, destination } = req.query;
  const user = await prisma.user.findFirst({
    where: {
      local: local as string,
    },
  });
  if (!user) {
    res.json({
      action: 'DENY',
      hash: '',
      name: '',
    });
    return;
  }

  const server = await prisma.destination.findFirst({
    where: {
      hostname: destination as string,
    },
  });
  if (!server) {
    res.json({
      action: 'DENY',
      hash: '',
      name: '',
    });
    return;
  }

  const policies = await prisma.policy.findMany({
    where: {
      userId: user.id,
      destinationId: server.id,
    },
  });

  if (!policies.length) {
    res.json({
      action: 'DENY',
      hash: '',
      name: '',
    });
  }

  if (policies.some((policy) => policy.action === 'DENY')) {
    res.json({
      action: 'DENY',
      hash: '',
      name: '',
    });
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

  res.send(403).json({
    message: 'Invalid policy actions found',
  });
  return;
});
