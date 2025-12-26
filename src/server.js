import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routers/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_URL, MONGODB_DB } = process.env;

if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_URL || !MONGODB_DB) {
  console.error('Missing MongoDB environment variables');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

const mongoUri = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_URL}/${MONGODB_DB}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    status: err.status || 500,
    message: err.message || 'Internal Server Error',
  });
});

app.get('/', (req, res) => {
  res.send('Server running!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
