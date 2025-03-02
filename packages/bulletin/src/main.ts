/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express, { Application } from 'express';
import * as bodyParser from 'body-parser';
import morgan from 'morgan';
import { portalRouter } from './routes/portal/router';
import { guildRouter } from './routes/guild/router';

export const app: Application = express();
app.use(morgan('combined'));
app.use(bodyParser.json());

app.use('/guild', guildRouter);
app.use('/portal', portalRouter);

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
