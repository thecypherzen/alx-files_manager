import express from 'express';
import {
  authRouter,
  appRouter,
  filesRouter,
  usersRouter,
} from './routes';

const app = express();
app.use(['/connect', '/disconnect'], authRouter);
app.use(['/stats', '/stats'], appRouter);
app.use('/files', filesRouter);
app.use('/users', usersRouter);

app.listen(process.env.PORT || 5000);
