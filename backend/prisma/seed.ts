import { PrismaClient, Role, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data in reverse dependency order
    await prisma.application.deleteMany();
    await prisma.recruitmentDrive.deleteMany();
    await prisma.company.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned existing database records.');

    // Common password hash for demo accounts: "Password123!"
    const demoPasswordHash = await bcrypt.hash('Password123!', SALT_ROUNDS);

    // ─── 1. TPO Account ─────────────────────────────────────────────────────────
    const tpoUser = await prisma.user.create({
        data: {
            email: 'tpo@admin.com',
            password: demoPasswordHash,
            role: Role.TPO,
        },
    });
    console.log('✅ Created TPO account:', tpoUser.email);

    // ─── 2. Student Accounts & Profiles ─────────────────────────────────────────

    // A. Eligible Student (Verified, Locked, Regular 12th path, High Marks & CPI)
    const student1 = await prisma.user.create({
        data: {
            email: 'student.eligible@example.com',
            password: demoPasswordHash,
            role: Role.STUDENT,
            studentProfile: {
                create: {
                    fullName: 'Aarav Sharma',
                    phone: '9876543210',
                    dob: new Date('2002-04-15'),
                    tenthSubjectMarks: {
                        tenthMaths: 92,
                        tenthPhysics: 88,
                        tenthChemistry: 85,
                        tenthEnglish: 90,
                        tenthComputer: 95,
                    },
                    tenthPercentage: 88.5,
                    isD2D: false,
                    twelfthPercentage: 86.0,
                    d2dCgpa: null,
                    cpi: 8.75,
                    profileLocked: true,
                    isVerified: true,
                },
            },
        },
        include: { studentProfile: true },
    });
    console.log('✅ Created Eligible Student:', student1.email);

    // B. D2D Student (Verified, Locked, Diploma-to-Degree path, High CGPA & CPI)
    const student2 = await prisma.user.create({
        data: {
            email: 'student.d2d@example.com',
            password: demoPasswordHash,
            role: Role.STUDENT,
            studentProfile: {
                create: {
                    fullName: 'Priya Patel',
                    phone: '9876543211',
                    dob: new Date('2002-08-20'),
                    tenthSubjectMarks: {
                        tenthMaths: 85,
                        tenthPhysics: 80,
                        tenthChemistry: 82,
                        tenthEnglish: 84,
                        tenthComputer: 88,
                    },
                    tenthPercentage: 83.8,
                    isD2D: true,
                    twelfthPercentage: null,
                    d2dCgpa: 8.9,
                    cpi: 8.4,
                    profileLocked: true,
                    isVerified: true,
                },
            },
        },
        include: { studentProfile: true },
    });
    console.log('✅ Created D2D Student:', student2.email);

    // C. Non-Eligible Student (Verified, Locked, Low CPI below drive requirements)
    const student3 = await prisma.user.create({
        data: {
            email: 'student.lowcpi@example.com',
            password: demoPasswordHash,
            role: Role.STUDENT,
            studentProfile: {
                create: {
                    fullName: 'Rohan Verma',
                    phone: '9876543212',
                    dob: new Date('2003-01-10'),
                    tenthSubjectMarks: {
                        tenthMaths: 60,
                        tenthPhysics: 58,
                        tenthChemistry: 55,
                        tenthEnglish: 62,
                        tenthComputer: 65,
                    },
                    tenthPercentage: 60.0,
                    isD2D: false,
                    twelfthPercentage: 58.5,
                    d2dCgpa: null,
                    cpi: 5.5,
                    profileLocked: true,
                    isVerified: true,
                },
            },
        },
        include: { studentProfile: true },
    });
    console.log('✅ Created Low CPI / Non-Eligible Student:', student3.email);

    // D. Unverified Student (Locked, but isVerified = false)
    const student4 = await prisma.user.create({
        data: {
            email: 'student.unverified@example.com',
            password: demoPasswordHash,
            role: Role.STUDENT,
            studentProfile: {
                create: {
                    fullName: 'Ananya Iyer',
                    phone: '9876543213',
                    dob: new Date('2003-05-25'),
                    tenthSubjectMarks: {
                        tenthMaths: 90,
                        tenthPhysics: 92,
                        tenthChemistry: 89,
                        tenthEnglish: 91,
                        tenthComputer: 94,
                    },
                    tenthPercentage: 91.2,
                    isD2D: false,
                    twelfthPercentage: 90.0,
                    d2dCgpa: null,
                    cpi: 9.1,
                    profileLocked: true,
                    isVerified: false,
                },
            },
        },
        include: { studentProfile: true },
    });
    console.log('✅ Created Unverified Student:', student4.email);

    // E. Unlocked / New Student (No profile created yet)
    const student5 = await prisma.user.create({
        data: {
            email: 'student.new@example.com',
            password: demoPasswordHash,
            role: Role.STUDENT,
        },
    });
    console.log('✅ Created New Unlocked Student:', student5.email);

    // ─── 3. Companies ───────────────────────────────────────────────────────────
    const company1 = await prisma.company.create({
        data: {
            name: 'TechCorp Global',
            imageUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea',
        },
    });

    const company2 = await prisma.company.create({
        data: {
            name: 'Innovate AI Systems',
            imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
        },
    });

    const company3 = await prisma.company.create({
        data: {
            name: 'DataStream Analytics',
            imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
        },
    });

    console.log('✅ Created 3 Companies:', company1.name, company2.name, company3.name);

    // ─── 4. Recruitment Drives ──────────────────────────────────────────────────
    const now = new Date();
    const deadline1 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
    const deadline2 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // +45 days
    const deadline3 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // +60 days

    // Drive 1: High bar (TechCorp — SDE)
    const drive1 = await prisma.recruitmentDrive.create({
        data: {
            companyId: company1.id,
            role: 'Software Development Engineer',
            ctc: 18.0,
            description: 'Core backend microservices, distributed caching, and high-throughput systems.',
            deadline: deadline1,
            minTenthPercentage: 75.0,
            minTwelfthPercentage: 75.0,
            minD2DCgpa: 8.0,
            minCpi: 7.5,
        },
    });

    // Drive 2: Frontend & D2D Friendly (Innovate AI — Frontend Developer)
    const drive2 = await prisma.recruitmentDrive.create({
        data: {
            companyId: company2.id,
            role: 'Frontend Engineer',
            ctc: 12.5,
            description: 'Modern web UI development with Next.js, React, and TypeScript.',
            deadline: deadline2,
            minTenthPercentage: 70.0,
            minTwelfthPercentage: null,
            minD2DCgpa: 8.0,
            minCpi: 7.0,
        },
    });

    // Drive 3: Broad Eligibility / Open Drive (DataStream — Associate Data Analyst)
    const drive3 = await prisma.recruitmentDrive.create({
        data: {
            companyId: company3.id,
            role: 'Associate Data Analyst',
            ctc: 8.0,
            description: 'SQL queries, dashboard visualization, and data pipeline monitoring.',
            deadline: deadline3,
            minTenthPercentage: 55.0,
            minTwelfthPercentage: 55.0,
            minD2DCgpa: 6.0,
            minCpi: 6.0,
        },
    });

    console.log('✅ Created 3 Recruitment Drives with varied criteria');

    // ─── 5. Sample Applications ─────────────────────────────────────────────────
    if (student1.studentProfile && student2.studentProfile) {
        const app1 = await prisma.application.create({
            data: {
                studentId: student1.studentProfile.id,
                driveId: drive1.id,
                status: ApplicationStatus.SHORTLISTED,
            },
        });

        const app2 = await prisma.application.create({
            data: {
                studentId: student2.studentProfile.id,
                driveId: drive2.id,
                status: ApplicationStatus.APPLIED,
            },
        });

        console.log('✅ Created Sample Applications:', app1.id, app2.id);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('──────────────────────────────────────────────────');
    console.log('Demo Credentials Summary:');
    console.log('TPO Admin:           tpo@admin.com / Password123!');
    console.log('Eligible Student:    student.eligible@example.com / Password123!');
    console.log('D2D Student:         student.d2d@example.com / Password123!');
    console.log('Low CPI Student:     student.lowcpi@example.com / Password123!');
    console.log('Unverified Student:  student.unverified@example.com / Password123!');
    console.log('New Student:         student.new@example.com / Password123!');
    console.log('──────────────────────────────────────────────────\n');
}

main()
    .catch((e) => {
        console.error('❌ Error during database seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
