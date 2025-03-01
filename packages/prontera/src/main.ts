/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import * as bodyParser from 'body-parser';
import morgan from 'morgan';
import { passwdRouter } from './routes/passwd';
import { groupRouter } from './routes/group';
import { shadowRouter } from './routes/shadow';
import { portalRouter } from './routes/portal/router';

const app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());

passwdRouter(app);
groupRouter(app);
shadowRouter(app);

app.use('/portal', portalRouter);

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
