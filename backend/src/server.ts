import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import exemploRoutes from './routes/exemplo.js';
import pool, { testConnection } from './db.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', exemploRoutes);

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, async () => {
  console.log(`API a correr em http://localhost:${PORT}`);
  
  const connectionTest = await testConnection();
  console.log(connectionTest.message);
});