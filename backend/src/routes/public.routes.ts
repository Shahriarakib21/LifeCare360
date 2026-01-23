import express from 'express';
import {
  searchDoctors,
  getDoctorProfile,
  getDoctorReviews,
  searchMedicines,
  getMedicineDetails,
  getHealthBlogs,
  getBlogPost,
} from '../controllers/public.controller';
import {
  searchLabTests,
  listLabs,
  getLabProfile,
  getCommonTests,
  getLabArticles
} from '../controllers/publicLab.controller';

const router = express.Router();

// Doctor search (public)
router.get('/doctors/search', searchDoctors);
router.get('/doctors/:id/reviews', getDoctorReviews);
router.get('/doctors/:id', getDoctorProfile);

// Medicine search (public)
router.get('/medicines/search', searchMedicines);
router.get('/medicines/:id', getMedicineDetails);

// Lab search & info (public)
router.get('/lab-tests/search', searchLabTests);
router.get('/lab-tests/common', getCommonTests);
router.get('/labs', listLabs);
router.get('/labs/:id', getLabProfile);
router.get('/lab-articles', getLabArticles);

// Health blog (public)
router.get('/blog', getHealthBlogs);
router.get('/blog/:slug', getBlogPost);

export default router;

