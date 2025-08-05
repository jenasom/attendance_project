import { PrismaClient, Role, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data in correct order (reverse of foreign key dependencies)
    console.log('Cleaning existing data...');
    await prisma.attendance.deleteMany();
    await prisma.studentCourse.deleteMany();
    await prisma.student.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@bioattendance.com',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: Role.ADMIN,
      },
    });
    console.log(`✅ Admin user created: ${admin.email}`);

    // Create teacher users
    console.log('Creating teacher users...');
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    
    const teacher1 = await prisma.user.create({
      data: {
        email: 'john.doe@bioattendance.com',
        password: teacherPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: Role.TEACHER,
      },
    });

    const teacher2 = await prisma.user.create({
      data: {
        email: 'jane.smith@bioattendance.com',
        password: teacherPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: Role.TEACHER,
      },
    });

    console.log(`✅ Teachers created: ${teacher1.email}, ${teacher2.email}`);

    // Create courses
    console.log('Creating courses...');
    const course1 = await prisma.course.create({
      data: {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Fundamental concepts of computer science including programming, algorithms, and data structures.',
        teacherId: teacher1.id,
      },
    });

    const course2 = await prisma.course.create({
      data: {
        name: 'Database Management Systems',
        code: 'CS201',
        description: 'Design and implementation of database systems, SQL, and database administration.',
        teacherId: teacher1.id,
      },
    });

    const course3 = await prisma.course.create({
      data: {
        name: 'Web Development',
        code: 'CS301',
        description: 'Modern web development using HTML, CSS, JavaScript, and popular frameworks.',
        teacherId: teacher2.id,
      },
    });

    const course4 = await prisma.course.create({
      data: {
        name: 'Machine Learning',
        code: 'CS401',
        description: 'Introduction to machine learning algorithms and their applications.',
        teacherId: teacher2.id,
      },
    });

    console.log(`✅ Courses created: ${course1.code}, ${course2.code}, ${course3.code}, ${course4.code}`);

    // Create sample fingerprint template (base64 encoded JSON)
    const sampleFingerprintTemplate = Buffer.from(JSON.stringify({
      version: '1.0',
      quality: 0.85,
      image_shape: [256, 256],
      minutiae: Array.from({ length: 25 }, (_, i) => ({
        x: Math.floor(Math.random() * 256),
        y: Math.floor(Math.random() * 256),
        orientation: Math.random() * 2 * Math.PI,
        type: 'bifurcation'
      })),
      minutiae_count: 25,
      created_at: new Date().toISOString()
    })).toString('base64');

    // Create students
    console.log('Creating students...');
    const students = await Promise.all([
      prisma.student.create({
        data: {
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@student.edu',
          studentId: 'STU001',
          fingerprintTemplate: sampleFingerprintTemplate,
        },
      }),
      prisma.student.create({
        data: {
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob.wilson@student.edu',
          studentId: 'STU002',
          fingerprintTemplate: sampleFingerprintTemplate,
        },
      }),
      prisma.student.create({
        data: {
          firstName: 'Carol',
          lastName: 'Brown',
          email: 'carol.brown@student.edu',
          studentId: 'STU003',
          fingerprintTemplate: sampleFingerprintTemplate,
        },
      }),
      prisma.student.create({
        data: {
          firstName: 'David',
          lastName: 'Davis',
          email: 'david.davis@student.edu',
          studentId: 'STU004',
          fingerprintTemplate: sampleFingerprintTemplate,
        },
      }),
      prisma.student.create({
        data: {
          firstName: 'Eva',
          lastName: 'Martinez',
          email: 'eva.martinez@student.edu',
          studentId: 'STU005',
          fingerprintTemplate: sampleFingerprintTemplate,
        },
      }),
      prisma.student.create({
        data: {
          firstName: 'Frank',
          lastName: 'Garcia',
          email: 'frank.garcia@student.edu',
          studentId: 'STU006',
        },
      }),
      prisma.student.create({
        data: {
          firstName: 'Grace',
          lastName: 'Lee',
          email: 'grace.lee@student.edu',
          studentId: 'STU007',
          fingerprintTemplate: sampleFingerprintTemplate,
        },
      }),
      prisma.student.create({
        data: {
          firstName: 'Henry',
          lastName: 'Taylor',
          email: 'henry.taylor@student.edu',
          studentId: 'STU008',
          fingerprintTemplate: sampleFingerprintTemplate,
        },
      }),
    ]);

    console.log(`✅ Students created: ${students.map(s => s.studentId).join(', ')}`);

    // Enroll students in courses
    console.log('Enrolling students in courses...');
    const enrollments = [
      // CS101 - Introduction to Computer Science (6 students)
      { studentId: students[0].id, courseId: course1.id },
      { studentId: students[1].id, courseId: course1.id },
      { studentId: students[2].id, courseId: course1.id },
      { studentId: students[3].id, courseId: course1.id },
      { studentId: students[4].id, courseId: course1.id },
      { studentId: students[5].id, courseId: course1.id },

      // CS201 - Database Management Systems (4 students)
      { studentId: students[0].id, courseId: course2.id },
      { studentId: students[1].id, courseId: course2.id },
      { studentId: students[6].id, courseId: course2.id },
      { studentId: students[7].id, courseId: course2.id },

      // CS301 - Web Development (5 students)
      { studentId: students[2].id, courseId: course3.id },
      { studentId: students[3].id, courseId: course3.id },
      { studentId: students[4].id, courseId: course3.id },
      { studentId: students[6].id, courseId: course3.id },
      { studentId: students[7].id, courseId: course3.id },

      // CS401 - Machine Learning (3 students)
      { studentId: students[5].id, courseId: course4.id },
      { studentId: students[6].id, courseId: course4.id },
      { studentId: students[7].id, courseId: course4.id },
    ];

    await prisma.studentCourse.createMany({
      data: enrollments,
    });

    console.log(`✅ Student enrollments created: ${enrollments.length} enrollments`);

    // Create sample attendance records for the past few days
    console.log('Creating sample attendance records...');
    const attendanceRecords = [];
    const courses = [course1, course2, course3, course4];
    
    // Generate attendance for the last 7 days
    for (let dayOffset = 7; dayOffset >= 1; dayOffset--) {
      const attendanceDate = new Date();
      attendanceDate.setDate(attendanceDate.getDate() - dayOffset);
      attendanceDate.setHours(9, Math.floor(Math.random() * 60), 0, 0); // Random time between 9:00-9:59 AM

      for (const course of courses) {
        // Get enrolled students for this course
        const enrolledStudents = enrollments
          .filter(e => e.courseId === course.id)
          .map(e => e.studentId);

        // Create attendance for 70-90% of enrolled students
        const attendanceRate = 0.7 + Math.random() * 0.2;
        const studentsToMark = Math.floor(enrolledStudents.length * attendanceRate);
        
        const shuffledStudents = enrolledStudents.sort(() => 0.5 - Math.random());
        const selectedStudents = shuffledStudents.slice(0, studentsToMark);

        for (const studentId of selectedStudents) {
          // 85% present, 10% late, 5% absent
          let status: AttendanceStatus = AttendanceStatus.PRESENT;
          const statusRandom = Math.random();
          if (statusRandom > 0.95) {
            status = AttendanceStatus.ABSENT;
          } else if (statusRandom > 0.85) {
            status = AttendanceStatus.LATE;
            // Late students arrive 10-60 minutes later
            attendanceDate.setMinutes(attendanceDate.getMinutes() + 10 + Math.floor(Math.random() * 50));
          }

          attendanceRecords.push({
            studentId,
            courseId: course.id,
            status,
            timestamp: new Date(attendanceDate),
          });
        }
      }
    }

    await prisma.attendance.createMany({
      data: attendanceRecords,
    });

    console.log(`✅ Attendance records created: ${attendanceRecords.length} records`);

    // Summary statistics
    const stats = {
      users: await prisma.user.count(),
      courses: await prisma.course.count(),
      students: await prisma.student.count(),
      enrollments: await prisma.studentCourse.count(),
      attendanceRecords: await prisma.attendance.count(),
    };

    console.log('\n📊 Seeding Summary:');
    console.log(`Users: ${stats.users} (1 admin, ${stats.users - 1} teachers)`);
    console.log(`Courses: ${stats.courses}`);
    console.log(`Students: ${stats.students}`);
    console.log(`Enrollments: ${stats.enrollments}`);
    console.log(`Attendance Records: ${stats.attendanceRecords}`);

    console.log('\n🔐 Default Login Credentials:');
    console.log('Admin: admin@bioattendance.com / admin123');
    console.log('Teacher 1: john.doe@bioattendance.com / teacher123');
    console.log('Teacher 2: jane.smith@bioattendance.com / teacher123');

    console.log('\n✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
