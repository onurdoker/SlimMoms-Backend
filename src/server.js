import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routers/auth.js';
import dietRouter from './routers/diet.js';
import initMongoDB from './db/initMongoDB.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

initMongoDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/diet', dietRouter);

app.get('/', (req, res) => {
  res.send('Server running!');
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
