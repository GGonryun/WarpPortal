import { Request, Response, Router } from 'express';

const computeTarget = async ({
  email,
  hostname,
}: {
  email: string;
  hostname: string;
}) => {
  // look for the user
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error('User does not exist in directory');
  }

  // look for the destination
  const server = await prisma.destination.findFirst({
    where: {
      hostname,
    },
  });

  if (!server) {
    throw new Error('Destination does not exist in directory');
  }

  // Optional: check user policy

  return `${user.local}@${server.ip}`;
};

export const targetRouter: Router = Router({ mergeParams: true });

targetRouter.get('/', async (req: Request, res: Response) => {
  const email = req.query.email as string;
  const hostname = req.query.hostname as string;
  if (!email || !hostname) {
    res.status(400).send({
      error: 'Missing email or hostname',
    });
    return;
  }
  try {
    res.send({ target: await computeTarget({ email, hostname }) });
  } catch (error) {
    res.status(403).send({
      error,
    });
    return;
  }
});
