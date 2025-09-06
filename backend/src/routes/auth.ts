import Router from '@koa/router';
import { register, login, refresh, logout } from '../controllers/authController';

const router = new Router({
  prefix: '/api/v1/auth'
});

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;