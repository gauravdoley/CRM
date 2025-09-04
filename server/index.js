import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import pipelineRoutes from './routes/pipelineRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js'; // 1. Import customer routes

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the Odoo Clone API!" });
});

app.use('/api/auth', authRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes); // 2. Use the customer routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('exit', async () => {
  await prisma.$disconnect();
});