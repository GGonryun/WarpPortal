import { prisma } from '@warpportal/prisma';

import { Router } from 'express';
export const registerRouter: Router = Router({ mergeParams: true });

registerRouter.post('/', async (req, res) => {
  const { ip, hostname } = req.body;
  if (!ip || !hostname) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  return res.json(await upsert(ip, hostname));
});

const upsert = async (ip: string, hostname: string) => {
  const server = await prisma.destination.findFirst({
    where: {
      hostname: hostname,
    },
  });
  if (server) {
    return prisma.destination.update({
      where: {
        id: server.id,
      },
      data: {
        ip: ip,
        hostname: hostname,
      },
    });
  } else {
    return prisma.destination.create({
      data: {
        ip: ip,
        hostname: hostname,
      },
    });
  }
};
