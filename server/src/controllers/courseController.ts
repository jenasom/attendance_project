import { Request, Response } from 'express';
import { prisma } from '../app';
import { validateCourseInput } from '../utils/validation';

interface AuthRequest extends Request {
  user?: any;
}

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description } = req.body;

    // Validate input
    const validation = validateCourseInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        name,
        code,
        description,
        teacherId: req.user.id
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        students: {
          include: {
            student: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
};

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      where: req.user.role === 'ADMIN' ? {} : { teacherId: req.user.id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        students: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: courses
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        students: {
          include: {
            student: true
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user has access to this course
    if (req.user.role !== 'ADMIN' && course.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course'
    });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    // Validate input
    const validation = validateCourseInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if course exists and user has access
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (req.user.role !== 'ADMIN' && existingCourse.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if course code is unique (excluding current course)
    if (code !== existingCourse.code) {
      const codeExists = await prisma.course.findUnique({
        where: { code }
      });

      if (codeExists) {
        return res.status(409).json({
          success: false,
          message: 'Course with this code already exists'
        });
      }
    }

    // Update course
    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        code,
        description
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        students: {
          include: {
            student: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully'
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if course exists and user has access
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (req.user.role !== 'ADMIN' && course.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete course (cascading will handle related records)
    await prisma.course.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course'
    });
  }
};

export const getCourseStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if course exists and user has access
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (req.user.role !== 'ADMIN' && course.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get course students
    const students = await prisma.studentCourse.findMany({
      where: { courseId: id },
      include: {
        student: true
      }
    });

    res.json({
      success: true,
      data: students.map(sc => sc.student)
    });

  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course students'
    });
  }
};
