import http from 'http';
import app from '../app';
import { prisma } from '../lib/prisma';

let server: http.Server;
let baseUrl: string;

function request(path: string, options: { method?: string; body?: unknown; cookie?: string } = {}) {
    const { method = 'GET', body, cookie } = options;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (cookie) {
        headers['Cookie'] = cookie;
    }

    return fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
}

function getCookie(res: Response): string {
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return '';
    return setCookie.split(';')[0];
}

async function runTests() {
    console.log('🧪 Starting Backend Integration Tests...\n');

    // Start server on dynamic port
    await new Promise<void>((resolve) => {
        server = app.listen(0, () => {
            const address = server.address();
            if (address && typeof address === 'object') {
                baseUrl = `http://localhost:${address.port}`;
            }
            resolve();
        });
    });

    try {
        // ─── Flow 1: Student/TPO login ─────────────────────────────────────────
        console.log('1. Testing Student & TPO login...');
        
        const tpoLoginRes = await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'tpo@admin.com', password: 'Password123!' },
        });
        if (tpoLoginRes.status !== 200) throw new Error(`TPO login failed with ${tpoLoginRes.status}`);
        const tpoCookie = getCookie(tpoLoginRes);
        if (!tpoCookie) throw new Error('No cookie set on TPO login');
        console.log('   ✅ TPO login successful');

        const studentLoginRes = await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'student.eligible@example.com', password: 'Password123!' },
        });
        if (studentLoginRes.status !== 200) throw new Error(`Student login failed with ${studentLoginRes.status}`);
        console.log('   ✅ Student login successful');

        // ─── Flow 2: Student profile submission ────────────────────────────────
        console.log('2. Testing Student profile submission...');
        const regRes = await request('/api/auth/register', {
            method: 'POST',
            body: { email: 'test.integration@example.com', password: 'Password123!' },
        });
        if (regRes.status !== 201) throw new Error(`Student registration failed with ${regRes.status}`);
        
        const freshStudentLoginRes = await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'test.integration@example.com', password: 'Password123!' },
        });
        const freshStudentCookie = getCookie(freshStudentLoginRes);

        const profileSubmitRes = await request('/api/students/profile', {
            method: 'POST',
            cookie: freshStudentCookie,
            body: {
                fullName: 'Test Integration Student',
                phone: '9988776655',
                dob: '2002-06-15',
                tenthSubjectMarks: {
                    tenthMaths: 85,
                    tenthPhysics: 82,
                    tenthChemistry: 80,
                    tenthEnglish: 88,
                    tenthComputer: 90,
                },
                tenthPercentage: 85.0,
                isD2D: false,
                twelfthPercentage: 84.0,
                cpi: 8.2,
            },
        });
        if (profileSubmitRes.status !== 201) {
            const errJson = await profileSubmitRes.json();
            throw new Error(`Profile submission failed with ${profileSubmitRes.status}: ${JSON.stringify(errJson)}`);
        }
        console.log('   ✅ Student profile submitted and locked');

        // ─── Flow 3: Profile locking ───────────────────────────────────────────
        console.log('3. Testing Profile locking...');
        const profileUpdateRes = await request('/api/students/profile', {
            method: 'PATCH',
            cookie: freshStudentCookie,
            body: { fullName: 'Modified Name' },
        });
        if (profileUpdateRes.status !== 403) {
            throw new Error(`Expected 403 for locked profile update, got ${profileUpdateRes.status}`);
        }
        console.log('   ✅ Locked profile update correctly rejected with 403');

        // ─── Flow 4: TPO verification ──────────────────────────────────────────
        console.log('4. Testing TPO verification...');
        const newStudentProfile = await prisma.studentProfile.findFirst({
            where: { user: { email: 'test.integration@example.com' } },
        });
        if (!newStudentProfile) throw new Error('New student profile not found in DB');

        const verifyRes = await request(`/api/tpo/students/${newStudentProfile.id}/verify`, {
            method: 'PATCH',
            cookie: tpoCookie,
        });
        if (verifyRes.status !== 200) throw new Error(`Verification failed with ${verifyRes.status}`);
        const verifyBody = (await verifyRes.json()) as { data: { verification: { isVerified: boolean } } };
        if (!verifyBody.data.verification.isVerified) throw new Error('isVerified is not true');
        console.log('   ✅ Student profile verified by TPO');

        // ─── Flow 5: Company creation ──────────────────────────────────────────
        console.log('5. Testing Company creation...');
        const companyRes = await request('/api/companies', {
            method: 'POST',
            cookie: tpoCookie,
            body: {
                name: 'Acme Test Labs',
                imageUrl: 'https://example.com/acme.png',
            },
        });
        if (companyRes.status !== 201) throw new Error(`Company creation failed with ${companyRes.status}`);
        const companyBody = (await companyRes.json()) as { data: { company: { id: string } } };
        const companyId = companyBody.data.company.id;
        console.log('   ✅ Company created successfully:', companyId);

        // ─── Flow 6: Recruitment drive creation ────────────────────────────────
        console.log('6. Testing Recruitment drive creation...');
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const driveRes = await request('/api/drives', {
            method: 'POST',
            cookie: tpoCookie,
            body: {
                companyId,
                role: 'Automation QA Engineer',
                ctc: 11.5,
                description: 'End-to-end integration and API testing.',
                deadline: futureDate,
                minTenthPercentage: 70.0,
                minTwelfthPercentage: 70.0,
                minCpi: 7.5,
            },
        });
        if (driveRes.status !== 201) {
            const errJson = await driveRes.json();
            throw new Error(`Drive creation failed with ${driveRes.status}: ${JSON.stringify(errJson)}`);
        }
        const driveBody = (await driveRes.json()) as { data: { drive: { id: string } } };
        const driveId = driveBody.data.drive.id;
        console.log('   ✅ Recruitment drive created successfully:', driveId);

        // ─── Flow 7: Eligibility checking ──────────────────────────────────────
        console.log('7. Testing Eligibility checking endpoint...');
        const eligibleRes = await request(`/api/drives/${driveId}/eligible-students`, {
            method: 'GET',
            cookie: tpoCookie,
        });
        if (eligibleRes.status !== 200) throw new Error(`Eligibility check failed with ${eligibleRes.status}`);
        const eligibleBody = (await eligibleRes.json()) as { data: { students: { id: string }[] } };
        const isStudentIncluded = eligibleBody.data.students.some((s) => s.id === newStudentProfile.id);
        if (!isStudentIncluded) throw new Error('Eligible student was not included in eligible list');
        console.log('   ✅ Eligibility check returned correct eligible list');

        // ─── Flow 8: Eligible application ──────────────────────────────────────
        console.log('8. Testing Eligible application submission...');
        const applyRes = await request(`/api/drives/${driveId}/apply`, {
            method: 'POST',
            cookie: freshStudentCookie,
        });
        if (applyRes.status !== 201) {
            const errJson = await applyRes.json();
            throw new Error(`Application failed with ${applyRes.status}: ${JSON.stringify(errJson)}`);
        }
        const applyBody = (await applyRes.json()) as { data: { application: { id: string; status: string } } };
        const applicationId = applyBody.data.application.id;
        if (applyBody.data.application.status !== 'APPLIED') throw new Error('Status is not APPLIED');
        console.log('   ✅ Application submitted successfully:', applicationId);

        // ─── Flow 9: Ineligible application rejection ──────────────────────────
        console.log('9. Testing Ineligible application rejection...');
        const lowCpiStudentLogin = await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'student.lowcpi@example.com', password: 'Password123!' },
        });
        const lowCpiCookie = getCookie(lowCpiStudentLogin);
        const ineligibleApplyRes = await request(`/api/drives/${driveId}/apply`, {
            method: 'POST',
            cookie: lowCpiCookie,
        });
        if (ineligibleApplyRes.status !== 403) {
            throw new Error(`Expected 403 for ineligible student apply, got ${ineligibleApplyRes.status}`);
        }
        console.log('   ✅ Ineligible application correctly rejected with 403');

        // ─── Flow 10: Duplicate application rejection ──────────────────────────
        console.log('10. Testing Duplicate application rejection...');
        const duplicateApplyRes = await request(`/api/drives/${driveId}/apply`, {
            method: 'POST',
            cookie: freshStudentCookie,
        });
        if (duplicateApplyRes.status !== 409) {
            throw new Error(`Expected 409 for duplicate apply, got ${duplicateApplyRes.status}`);
        }
        console.log('   ✅ Duplicate application correctly rejected with 409');

        // ─── Flow 11: Application status update ─────────────────────────────
        console.log('11. Testing Application status update...');
        const statusUpdateRes = await request(`/api/tpo/applications/${applicationId}/status`, {
            method: 'PATCH',
            cookie: tpoCookie,
            body: { status: 'SHORTLISTED' },
        });
        if (statusUpdateRes.status !== 200) throw new Error(`Status update failed with ${statusUpdateRes.status}`);
        const statusBody = (await statusUpdateRes.json()) as { data: { application: { status: string } } };
        if (statusBody.data.application.status !== 'SHORTLISTED') throw new Error('Status update mismatch');
        console.log('   ✅ Application status updated to SHORTLISTED');

        console.log('\n🎉 ALL 11 INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
    } finally {
        if (server) {
            server.close();
        }
        await prisma.$disconnect();
    }
}

runTests().catch((err) => {
    console.error('\n❌ INTEGRATION TEST FAILURE:', err);
    process.exit(1);
});
