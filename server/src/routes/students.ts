import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  registerStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentCourses,
  enrollStudentInCourse,
  unenrollStudentFromCourse
} from '../controllers/studentController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Student CRUD operations
router.post('/', requireRole(['ADMIN', 'TEACHER']), registerStudent);
router.get('/', getStudents);
router.get('/:id', getStudentById);
router.put('/:id', requireRole(['ADMIN', 'TEACHER']), updateStudent);
router.delete('/:id', requireRole(['ADMIN', 'TEACHER']), deleteStudent);

// Student-specific operations
router.get('/:id/courses', getStudentCourses);
router.post('/:id/courses/:courseId', requireRole(['ADMIN', 'TEACHER']), enrollStudentInCourse);
router.delete('/:id/courses/:courseId', requireRole(['ADMIN', 'TEACHER']), unenrollStudentFromCourse);

export default router;
