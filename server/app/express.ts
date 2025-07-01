import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import { ApiResponse } from './lib/api.helper';
import { register as authRoutes } from './routes/auth';
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(useragent.express());

// routes
app.get('/api/v1/health-check', (req, res) => {
  res.json(
    new ApiResponse(200, 'Health check successful', undefined, undefined)
  );
});

app.use('/api/v1/auth', authRoutes());

export default app;
