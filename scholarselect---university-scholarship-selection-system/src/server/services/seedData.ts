import bcrypt from 'bcryptjs';
import { UserRepo } from '../models/User.js';
import { StudentRepo } from '../models/Student.js';
import { ApplicationRepo } from '../models/Application.js';
import { BudgetRepo } from '../models/Budget.js';

export async function seedDatabaseIfEmpty() {
  const existingUsers = await UserRepo.countDocuments();
  if (existingUsers > 0) {
    console.log('[Seed] Database already contains records. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding initial university administrative and student data...');

  const hashedPasswordAdmin = await bcrypt.hash('Admin@123456', 10);
  const hashedPasswordStudent = await bcrypt.hash('Student@123456', 10);

  // 1. Create Administrator
  const adminUser = await UserRepo.create({
    name: 'Dr. Eleanor Vance (Dean of Student Aid)',
    email: 'admin@university.edu',
    password: hashedPasswordAdmin,
    role: 'admin',
    department: 'University Scholarship Committee',
  });

  // 2. Sample Students & Applications
  const sampleStudents = [
    {
      studentId: 'STU-2026-101',
      name: 'Arun Reddy',
      email: 'arun.student@university.edu',
      department: 'Computer Science',
      course: 'B.S. Artificial Intelligence & Computing',
      academicYear: '3rd Year',
      gpa: 3.92,
      phone: '+1 (555) 234-5678',
      householdIncome: 32000,
      familyMembers: 5,
      cost: 6500,
      needScore: 42,
      meritScore: 48,
      priorityScore: 90,
      reason:
        'First-generation university student conducting undergraduate machine learning research on assistive communication technologies. Funds required for tuition offset and lab research equipment.',
    },
    {
      studentId: 'STU-2026-102',
      name: 'Maya Lin',
      email: 'maya.lin@university.edu',
      department: 'Electrical Engineering',
      course: 'M.S. Robotics & Power Electronics',
      academicYear: 'Graduate 1st Year',
      gpa: 3.85,
      phone: '+1 (555) 345-6789',
      householdIncome: 38000,
      familyMembers: 4,
      cost: 8000,
      needScore: 38,
      meritScore: 45,
      priorityScore: 83,
      reason:
        'Developing low-cost prosthetic sensors for rehabilitation clinics. Award supports specialized fabrication materials and graduate tuition.',
    },
    {
      studentId: 'STU-2026-103',
      name: 'David Kim',
      email: 'david.kim@university.edu',
      department: 'Economics',
      course: 'B.A. Quantitative Economics & Policy',
      academicYear: '2nd Year',
      gpa: 3.78,
      phone: '+1 (555) 456-7890',
      householdIncome: 26000,
      familyMembers: 6,
      cost: 5000,
      needScore: 46,
      meritScore: 40,
      priorityScore: 86,
      reason:
        'Focusing on rural economic development models. Working 20 hours a week alongside full coursework to support younger siblings.',
    },
    {
      studentId: 'STU-2026-104',
      name: 'Sophia Rodriguez',
      email: 'sophia.rodriguez@university.edu',
      department: 'Biomedical Engineering',
      course: 'B.S. Biomedical Engineering',
      academicYear: '4th Year',
      gpa: 3.96,
      phone: '+1 (555) 567-8901',
      householdIncome: 24000,
      familyMembers: 4,
      cost: 7500,
      needScore: 48,
      meritScore: 49,
      priorityScore: 97,
      reason:
        'Senior capstone lead developing diagnostic microfluidic strips for waterborne pathogen detection in marginalized communities.',
    },
    {
      studentId: 'STU-2026-105',
      name: 'James Wilson',
      email: 'james.wilson@university.edu',
      department: 'Mechanical Engineering',
      course: 'B.S. Aerospace & Thermal Systems',
      academicYear: '1st Year',
      gpa: 3.45,
      phone: '+1 (555) 678-9012',
      householdIncome: 58000,
      familyMembers: 3,
      cost: 4200,
      needScore: 25,
      meritScore: 32,
      priorityScore: 57,
      reason:
        'Engineering student participating in collegiate Formula SAE design competition requiring essential textbook and lab fee support.',
    },
    {
      studentId: 'STU-2026-106',
      name: 'Aisha Patel',
      email: 'aisha.patel@university.edu',
      department: 'Data Science',
      course: 'M.S. Applied Data Science',
      academicYear: 'Graduate 2nd Year',
      gpa: 3.88,
      phone: '+1 (555) 789-0123',
      householdIncome: 35000,
      familyMembers: 4,
      cost: 6000,
      needScore: 39,
      meritScore: 47,
      priorityScore: 86,
      reason:
        'Published researcher in algorithmic fairness and climate data modeling. Needs tuition relief to complete master’s thesis and conference presentations.',
    },
    {
      studentId: 'STU-2026-107',
      name: 'Marcus Chen',
      email: 'marcus.chen@university.edu',
      department: 'Physics',
      course: 'B.S. Quantum Optics & Astrophysics',
      academicYear: '3rd Year',
      gpa: 3.91,
      phone: '+1 (555) 890-1234',
      householdIncome: 42000,
      familyMembers: 3,
      cost: 5500,
      needScore: 35,
      meritScore: 48,
      priorityScore: 83,
      reason:
        'Conducted research at national accelerator laboratory. Seeking funding to cover off-campus research travel and specialized academic software.',
    },
    {
      studentId: 'STU-2026-108',
      name: 'Fatima Zahra',
      email: 'fatima.zahra@university.edu',
      department: 'Public Health',
      course: 'Master of Public Health (Epidemiology)',
      academicYear: 'Graduate 1st Year',
      gpa: 3.82,
      phone: '+1 (555) 901-2345',
      householdIncome: 28000,
      familyMembers: 5,
      cost: 7000,
      needScore: 44,
      meritScore: 42,
      priorityScore: 86,
      reason:
        'Dedicated to urban preventative health initiatives and community maternal health workshops. Scholarship allows full-time clinical fieldwork.',
    },
    {
      studentId: 'STU-2026-109',
      name: 'Lucas Müller',
      email: 'lucas.muller@university.edu',
      department: 'Architecture',
      course: 'Bachelor of Architecture (Sustainable Design)',
      academicYear: '3rd Year',
      gpa: 3.65,
      phone: '+1 (555) 012-3456',
      householdIncome: 48000,
      familyMembers: 4,
      cost: 9000,
      needScore: 30,
      meritScore: 38,
      priorityScore: 68,
      reason:
        'Focus on energy-efficient affordable housing architectures. Studio model construction and digital drafting materials represent extreme expense.',
    },
    {
      studentId: 'STU-2026-110',
      name: 'Chloé Dubois',
      email: 'chloe.dubois@university.edu',
      department: 'Chemistry',
      course: 'Ph.D. Green Catalysis & Polymer Science',
      academicYear: 'Doctoral 2nd Year',
      gpa: 3.97,
      phone: '+1 (555) 123-4567',
      householdIncome: 34000,
      familyMembers: 3,
      cost: 10500,
      needScore: 40,
      meritScore: 49,
      priorityScore: 89,
      reason:
        'Synthesizing biodegradable plastics from agricultural cellulose waste. Scholarship helps offset critical dissertation laboratory fees.',
    },
    {
      studentId: 'STU-2026-111',
      name: 'Kwame Asante',
      email: 'kwame.asante@university.edu',
      department: 'Civil Engineering',
      course: 'B.S. Structural & Water Infrastructure',
      academicYear: '2nd Year',
      gpa: 3.72,
      phone: '+1 (555) 234-9876',
      householdIncome: 27000,
      familyMembers: 6,
      cost: 4800,
      needScore: 45,
      meritScore: 36,
      priorityScore: 81,
      reason:
        'Active mentor in National Society of Black Engineers. Balancing studies with student campus job to manage housing costs.',
    },
    {
      studentId: 'STU-2026-112',
      name: 'Elena Popova',
      email: 'elena.popova@university.edu',
      department: 'Mathematics',
      course: 'B.S. Computational Mathematics & Cryptography',
      academicYear: '1st Year',
      gpa: 3.89,
      phone: '+1 (555) 345-8765',
      householdIncome: 52000,
      familyMembers: 3,
      cost: 3500,
      needScore: 28,
      meritScore: 47,
      priorityScore: 75,
      reason:
        'International Olympiad competitor now mentoring freshmen math tutoring circles. Requesting grant for academic hardware and tuition balance.',
    },
  ];

  for (const s of sampleStudents) {
    // Create student user account
    const studentUser = await UserRepo.create({
      name: s.name,
      email: s.email,
      password: hashedPasswordStudent,
      role: 'student',
      studentId: s.studentId,
      department: s.department,
    });

    // Create student record
    const studentDoc = await StudentRepo.create({
      studentId: s.studentId,
      name: s.name,
      email: s.email,
      department: s.department,
      course: s.course,
      academicYear: s.academicYear,
      gpa: s.gpa,
      phone: s.phone,
      householdIncome: s.householdIncome,
      familyMembers: s.familyMembers,
      userId: studentUser._id,
    });

    // Create scholarship application
    await ApplicationRepo.create({
      studentId: s.studentId,
      studentName: s.name,
      email: s.email,
      department: s.department,
      course: s.course,
      academicYear: s.academicYear,
      cycleYear: '2025-2026',
      scholarshipAmount: s.cost,
      priorityScore: s.priorityScore,
      gpa: s.gpa,
      financialNeedScore: s.needScore,
      meritScore: s.meritScore,
      reason: s.reason,
      status: 'Submitted',
      awardedAmount: 0,
      submissionDate: new Date(Date.now() - Math.floor(Math.random() * 15 + 1) * 86400000).toISOString(),
      userId: studentUser._id,
    });
  }

  // 3. Create Scholarship Budget for 2025-2026
  const totalBudget = 50000; // $50,000 university pool
  await BudgetRepo.create({
    academicYear: '2025-2026',
    title: 'University Presidential & Need-Based Scholarship Endowment Fund',
    totalBudget,
    allocatedBudget: 0,
    remainingBudget: totalBudget,
    isFinalized: false,
    history: [
      {
        date: new Date().toISOString(),
        previousBudget: 0,
        newBudget: totalBudget,
        changedBy: adminUser.name,
        notes: 'Initial institutional allocation for Academic Year 2025-2026 approved by Board of Trustees.',
      },
    ],
  });

  console.log('[Seed] Seeding completed: 1 Admin, 12 Students, 12 Applications, and $50,000 Active Budget ready.');
}
