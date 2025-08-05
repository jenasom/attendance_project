import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  markAttendance,
  getAttendanceRecords,
  getAttendanceByStudent,
  getAttendanceByCourse,
  getTodayAttendanceForCourse,
  getRecentAttendance,
  updateAttendanceStatus,
  deleteAttendanceRecord
} from '../controllers/attendanceController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Attendance operations
router.post('/mark', requireRole(['ADMIN', 'TEACHER']), markAttendance);
router.get('/', getAttendanceRecords);
router.get('/recent', getRecentAttendance);
router.get('/student/:studentId', getAttendanceByStudent);
router.get('/course/:courseId', getAttendanceByCourse);
router.get('/course/:courseId/today', getTodayAttendanceForCourse);

// Update/Delete attendance (admin operations)
router.put('/:id', requireRole(['ADMIN']), updateAttendanceStatus);
router.delete('/:id', requireRole(['ADMIN']), deleteAttendanceRecord);

export default router;
