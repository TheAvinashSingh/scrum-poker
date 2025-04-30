// Static file handler for client-side routing
import { createReadStream } from 'fs';
import { join } from 'path';
import express from 'express';

const app = express();
const router = express.Router();

// Serve static files
app.use(express.static(join(process.cwd(), 'dist')));

// Always return index.html for any route to support client-side routing
router.get('*', (req, res) => {
  try {
    const stream = createReadStream(join(process.cwd(), 'dist', 'index.html'));
    stream.pipe(res);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/', router);

export default app;