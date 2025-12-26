import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routers/auth.js';
import dietRouter from './routers/diet.js';
import initMongoDB from './db/initMongoDB.js';

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

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    status: err.status || 500,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
