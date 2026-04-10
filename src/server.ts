import 'dotenv/config';
import path from 'path';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
 import connectDB from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import convRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import friendRoutes from './routes/friends';
import { initSocket }   from './sockets';
import { setupSwagger } from './docs/swagger';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5500'],
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded files as static — GET /uploads/filename.jpg
// app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth',authRoutes);
app.use('/api/users',userRoutes);
app.use('/api/conversations', convRoutes);
app.use('/api/messages',messageRoutes);
app.use('/api/friends',friendRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSwagger(app);

app.use((_req, res) => { res.status(404).json({ message: 'Route not found' }); });

initSocket(io);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(` Socket.IO ready`);
  });
}).catch((err) => {
  console.error(' MongoDB connection failed:', err.message);
  process.exit(1);
});