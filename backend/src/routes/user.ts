import Router from '@koa/router';
import { getCurrentUser, updateUser, getUserLinks, updatePassword } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = new Router({
  prefix: '/api/v1/user'
});

router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateUser);
router.put('/password', authenticate, updatePassword);
router.get('/links', authenticate, getUserLinks);

export default router;