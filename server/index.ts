import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { LocalStorageAdapter } from './storage/local.js';
import { createRoutes } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const app = express();
app.use(cors());
app.use(express.json());

const storage = new LocalStorageAdapter(publicDir);
app.use('/api', createRoutes(storage, publicDir));
app.use('/public', express.static(publicDir));

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Admin API server running on http://localhost:${PORT}`);
});
