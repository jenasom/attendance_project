import { Request, Response } from 'express';
import { prisma } from '../app';
import { validateStudentInput } from '../utils/validation';

interface AuthRequest extends Request {
  user?: any;
}

export const registerStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, studentId, fingerprintTemplate, courseIds } = req.body;

    // Validate input
    const validation = validateStudentInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if student already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { email },
          { studentId }
        ]
      }
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email or student ID already exists'
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create student
      const student = await tx.student.create({
        data: {
          firstName,
          lastName,
          email,
          studentId,
          fingerprintTemplate
        }
      });

      // Enroll in courses if provided
      if (courseIds && courseIds.length > 0) {
        await tx.studentCourse.createMany({
          data: courseIds.map((courseId: string) => ({
            studentId: student.id,
            courseId
          }))
        });
      }

      // Return student with courses
      return await tx.student.findUnique({
        where: { id: student.id },
        include: {
          courses: {
            include: {
              course: true
            }
          }
        }
      });
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Student registered successfully'
    });

  } catch (error) {
    console.error('Register student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register student'
    });
  }
};

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        courses: {
          include: {
            course: true
          }
        },
        attendances: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            course: true
          }
        },
        attendances: {
          include: {
            course: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student'
    });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, studentId, fingerprintTemplate } = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check for duplicate email or studentId (excluding current student)
    const duplicateStudent = await prisma.student.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { email },
              { studentId }
            ]
          }
        ]
      }
    });

    if (duplicateStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email or student ID already exists'
      });
    }

    // Update student
    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        studentId,
        ...(fingerprintTemplate && { fingerprintTemplate })
      },
      include: {
        courses: {
          include: {
            course: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: student,
      message: 'Student updated successfully'
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student'
    });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete student (cascading will handle related records)
    await prisma.student.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student'
    });
  }
};

export const getStudentCourses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            course: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student.courses.map(sc => sc.course)
    });

  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student courses'
    });
  }
};

export const enrollStudentInCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id: studentId, courseId } = req.params;

    // Check if student and course exist
    const [student, course] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.course.findUnique({ where: { id: courseId } })
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.studentCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    // Enroll student
    await prisma.studentCourse.create({
      data: {
        studentId,
        courseId
      }
    });

    res.json({
      success: true,
      message: 'Student enrolled successfully'
    });

  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll student'
    });
  }
};

export const unenrollStudentFromCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id: studentId, courseId } = req.params;

    // Check if enrollment exists
    const enrollment = await prisma.studentCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    // Unenroll student
    await prisma.studentCourse.delete({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });

    res.json({
      success: true,
      message: 'Student unenrolled successfully'
    });

  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unenroll student'
    });
  }
};
