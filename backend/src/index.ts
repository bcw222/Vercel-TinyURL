import Koa from 'koa';
import cors from 'koa-cors';
import bodyParser from 'koa-bodyparser';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import shortLinkRoutes from './routes/shortLink';

const app = new Koa();
const PORT = process.env.PORT || 3000;

// Error handling middleware (must be first)
app.use(errorHandler);

// Middleware
app.use(cors());
app.use(bodyParser());

// Routes
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());
app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());
app.use(shortLinkRoutes.routes());
app.use(shortLinkRoutes.allowedMethods());

// Fallback error handling
app.on('error', (err, ctx) => {
  console.error('Unhandled server error', err);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;