import { Router } from 'express';
import { groupRouter } from './group';
import { passwdRouter } from './passwd';
import { shadowRouter } from './shadow';

export const guildRouter: Router = Router({ mergeParams: true });

guildRouter.use('/passwd', passwdRouter);
guildRouter.use('/shadow', shadowRouter);
guildRouter.use('/group', groupRouter);
