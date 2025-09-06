import Router from '@koa/router';
import {
  createShortLink,
  getShortLinkInfo,
  updateShortLink,
  deleteShortLink,
  redirectToOriginal
} from '../controllers/shortLinkController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = new Router({
  prefix: '/api/v1'
});

router.post('/shorten', optionalAuth, createShortLink);
router.get('/info/:slug', getShortLinkInfo);
router.put('/shorten/:slug', authenticate, updateShortLink);
router.delete('/:slug', authenticate, deleteShortLink);
router.get('/:slug', redirectToOriginal);

export default router;