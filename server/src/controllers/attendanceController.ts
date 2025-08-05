import { Request, Response } from 'express';
import { prisma } from '../app';
import { validateAttendanceInput } from '../utils/validation';
import { matchFingerprint } from '../services/fingerprintService';

interface AuthRequest extends Request {
  user?: any;
}

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, fingerprintTemplate } = req.body;

    // Validate input
    const validation = validateAttendanceInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Match fingerprint against enrolled students
    const matchResult = await matchFingerprint(fingerprintTemplate, courseId);

    if (!matchResult.success || !matchResult.studentId) {
      return res.status(404).json({
        success: false,
        message: 'No matching student found for this fingerprint'
      });
    }

    const studentId = matchResult.studentId;

    // Check if attendance already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        courseId,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this student today'
      });
    }

    // Determine attendance status based on time
    const now = new Date();
    const currentHour = now.getHours();
    let status = 'PRESENT';

    // Mark as late if after 9 AM (configurable)
    if (currentHour >= 9) {
      status = 'LATE';
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        courseId,
        status: status as 'PRESENT' | 'LATE' | 'ABSENT',
        timestamp: now
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: attendance,
      message: `Attendance marked successfully for ${attendance.student.firstName} ${attendance.student.lastName}`
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
};

export const getAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const { courseId, studentId, startDate, endDate, status } = req.query;

    // Build where clause
    const where: any = {};

    if (courseId) where.courseId = courseId as string;
    if (studentId) where.studentId = studentId as string;
    if (status) where.status = status as string;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) {
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        where.timestamp.lte = endDateTime;
      }
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records'
    });
  }
};

export const getAttendanceByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attendance'
    });
  }
};

export const getAttendanceByCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const attendanceRecords = await prisma.attendance.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Get course attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course attendance'
    });
  }
};

export const getTodayAttendanceForCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s attendance'
    });
  }
};

export const getRecentAttendance = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const attendanceRecords = await prisma.attendance.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    res.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Get recent attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent attendance'
    });
  }
};

export const updateAttendanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PRESENT', 'LATE', 'ABSENT'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status'
      });
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: { status },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance status updated successfully'
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance status'
    });
  }
};

export const deleteAttendanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.attendance.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record'
    });
  }
};
