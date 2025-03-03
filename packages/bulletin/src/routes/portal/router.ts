import { Router } from 'express';
import { issueRouter } from './issue';
import { accessRouter } from './access';
import { targetRouter } from './target';
import { registerRouter } from './register';

export const portalRouter: Router = Router({ mergeParams: true });

portalRouter.use('/issue', issueRouter);
portalRouter.use('/target', targetRouter);
portalRouter.use('/access', accessRouter);
portalRouter.use('/register', registerRouter);
