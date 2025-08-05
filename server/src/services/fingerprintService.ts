import axios from 'axios';
import { prisma } from '../app';

interface MatchResult {
  success: boolean;
  studentId?: string;
  confidence?: number;
  error?: string;
}

/**
 * Match a fingerprint template against enrolled students in a course
 */
export const matchFingerprint = async (template: string, courseId: string): Promise<MatchResult> => {
  try {
    // Get all students enrolled in the course with their fingerprint templates
    const enrolledStudents = await prisma.studentCourse.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            fingerprintTemplate: true
          }
        }
      }
    });

    if (enrolledStudents.length === 0) {
      return {
        success: false,
        error: 'No students enrolled in this course'
      };
    }

    // Prepare templates for matching
    const templates = enrolledStudents
      .filter(es => es.student.fingerprintTemplate)
      .map(es => ({
        studentId: es.student.id,
        template: es.student.fingerprintTemplate
      }));

    if (templates.length === 0) {
      return {
        success: false,
        error: 'No fingerprint templates found for enrolled students'
      };
    }

    // Call Python matching service
    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';
    
    const response = await axios.post(`${pythonServerUrl}/match`, {
      inputTemplate: template,
      templates: templates
    }, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data.success && response.data.match) {
      return {
        success: true,
        studentId: response.data.match.studentId,
        confidence: response.data.match.confidence
      };
    } else {
      return {
        success: false,
        error: 'No matching fingerprint found'
      };
    }

  } catch (error: any) {
    console.error('Fingerprint matching error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Unable to connect to fingerprint matching service. Please ensure the Python server is running.'
      };
    }

    return {
      success: false,
      error: 'Failed to match fingerprint'
    };
  }
};

/**
 * Verify fingerprint template quality
 */
export const verifyFingerprintQuality = async (template: string): Promise<{ isValid: boolean; quality?: number; error?: string }> => {
  try {
    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';
    
    const response = await axios.post(`${pythonServerUrl}/verify-quality`, {
      template
    }, {
      timeout: 5000
    });

    return {
      isValid: response.data.success,
      quality: response.data.quality,
      error: response.data.error
    };

  } catch (error: any) {
    console.error('Fingerprint quality verification error:', error);
    return {
      isValid: false,
      error: 'Failed to verify fingerprint quality'
    };
  }
};

/**
 * Extract features from fingerprint template
 */
export const extractFingerprintFeatures = async (template: string): Promise<{ success: boolean; features?: any; error?: string }> => {
  try {
    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';
    
    const response = await axios.post(`${pythonServerUrl}/extract-features`, {
      template
    }, {
      timeout: 5000
    });

    return {
      success: response.data.success,
      features: response.data.features,
      error: response.data.error
    };

  } catch (error: any) {
    console.error('Feature extraction error:', error);
    return {
      success: false,
      error: 'Failed to extract fingerprint features'
    };
  }
};
