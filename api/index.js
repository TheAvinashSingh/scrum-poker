// Serverless entry point for Vercel
import express from 'express';
import cors from 'cors';
import { routes } from './routes.js';
 
const app = express();

// Enable CORS for all origins in serverless environment
app.use(cors());

// JSON middleware
app.use(express.json());

// Simple routes for serverless
app.use('/api', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export for Vercel
export default app;