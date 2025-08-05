import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseStudents
} from '../controllers/courseController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Course CRUD operations
router.post('/', requireRole(['ADMIN', 'TEACHER']), createCourse);
router.get('/', getCourses);
router.get('/:id', getCourseById);
router.put('/:id', requireRole(['ADMIN', 'TEACHER']), updateCourse);
router.delete('/:id', requireRole(['ADMIN', 'TEACHER']), deleteCourse);

// Course-specific operations
router.get('/:id/students', getCourseStudents);

export default router;
