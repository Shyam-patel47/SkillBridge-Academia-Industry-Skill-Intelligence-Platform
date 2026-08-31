import {
  PrismaClient,
  UserRole,
  ProficiencyLevel,
  DifficultyLevel,
  DemandLevel,
  OpportunityType,
  WorkMode,
  ApplicationStatus,
  LearningType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting SkillBridge database seed...");

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // ==========================================
  // 1. Seed Skill Categories
  // ==========================================
  console.log("📦 Seeding Skill Categories...");
  const categories = [
    {
      name: "Frontend Development",
      slug: "frontend-development",
      description:
        "Client-side technologies, UI frameworks, responsive design, and browser optimization.",
      icon: "Layout",
      order: 1,
    },
    {
      name: "Backend Engineering",
      slug: "backend-engineering",
      description:
        "Server architectures, microservices, REST APIs, and business logic processing.",
      icon: "Server",
      order: 2,
    },
    {
      name: "Database & Data Systems",
      slug: "database-data-systems",
      description:
        "Relational databases, caching layers, query optimization, and schema design.",
      icon: "Database",
      order: 3,
    },
    {
      name: "Cloud & DevOps",
      slug: "cloud-devops",
      description:
        "Containerization, CI/CD pipelines, cloud infrastructure, and deployment automation.",
      icon: "Cloud",
      order: 4,
    },
    {
      name: "AI & Data Science",
      slug: "ai-data-science",
      description:
        "Machine learning, data analytics, statistical modeling, and LLM integrations.",
      icon: "Brain",
      order: 5,
    },
    {
      name: "Soft Skills & Leadership",
      slug: "soft-skills-leadership",
      description:
        "Technical communication, collaborative teamwork, agile methodology, and problem-solving.",
      icon: "Users",
      order: 6,
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const created = await prisma.skillCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
  }

  // ==========================================
  // 2. Seed Skills Taxonomy
  // ==========================================
  console.log("⚡ Seeding Skills Taxonomy...");
  const skillsData = [
    // Frontend
    {
      name: "JavaScript",
      slug: "javascript",
      categorySlug: "frontend-development",
      description:
        "Core ECMAScript fundamentals, DOM manipulation, asynchronous programming, and event loops.",
    },
    {
      name: "TypeScript",
      slug: "typescript",
      categorySlug: "frontend-development",
      description:
        "Static typing, interfaces, generics, type guards, and advanced TypeScript configurations.",
    },
    {
      name: "React",
      slug: "react",
      categorySlug: "frontend-development",
      description:
        "Component architecture, Hooks, Virtual DOM, state management, and performance optimization.",
    },
    {
      name: "Next.js",
      slug: "nextjs",
      categorySlug: "frontend-development",
      description:
        "Server-Side Rendering (SSR), App Router, Static Site Generation (SSG), and API routes.",
    },
    {
      name: "HTML & CSS",
      slug: "html-css",
      categorySlug: "frontend-development",
      description:
        "Semantic HTML5, CSS Flexbox/Grid, responsive layouts, animations, and accessibility (a11y).",
    },

    // Backend
    {
      name: "Node.js",
      slug: "nodejs",
      categorySlug: "backend-engineering",
      description:
        "Non-blocking I/O, event-driven architecture, streams, buffer management, and worker threads.",
    },
    {
      name: "Express.js",
      slug: "expressjs",
      categorySlug: "backend-engineering",
      description:
        "RESTful API routing, custom middleware pipelines, error handling, and authentication integration.",
    },
    {
      name: "Python",
      slug: "python",
      categorySlug: "backend-engineering",
      description:
        "Object-oriented programming, scripting, data structures, FastAPI, and standard library mastery.",
    },
    {
      name: "Java",
      slug: "java",
      categorySlug: "backend-engineering",
      description:
        "Object-oriented principles, Spring Boot framework, JVM memory management, and concurrency.",
    },
    {
      name: "REST APIs",
      slug: "rest-apis",
      categorySlug: "backend-engineering",
      description:
        "RESTful architecture, status codes, payload contract design, rate limiting, and OpenAPI specs.",
    },

    // Database
    {
      name: "PostgreSQL",
      slug: "postgresql",
      categorySlug: "database-data-systems",
      description:
        "Relational data modeling, ACID transactions, complex joins, indexing, and JSONB queries.",
    },
    {
      name: "SQL & Query Optimization",
      slug: "sql-optimization",
      categorySlug: "database-data-systems",
      description:
        "Query execution plans, normalization, window functions, and indexing strategies.",
    },
    {
      name: "Redis",
      slug: "redis",
      categorySlug: "database-data-systems",
      description:
        "In-memory key-value caching, Pub/Sub messaging, session storage, and rate limiting.",
    },

    // Cloud & DevOps
    {
      name: "Docker",
      slug: "docker",
      categorySlug: "cloud-devops",
      description:
        "Containerization, Dockerfiles, multi-stage builds, networking, and Docker Compose orchestration.",
    },
    {
      name: "Git & GitHub",
      slug: "git-github",
      categorySlug: "cloud-devops",
      description:
        "Branching workflows, merge conflicts, interactive rebasing, pull request reviews, and hooks.",
    },
    {
      name: "CI/CD Pipelines",
      slug: "cicd-pipelines",
      categorySlug: "cloud-devops",
      description:
        "Automated testing, GitHub Actions, deployment workflows, and artifact release management.",
    },
    {
      name: "AWS Cloud",
      slug: "aws-cloud",
      categorySlug: "cloud-devops",
      description:
        "EC2, S3, RDS, Lambda, IAM permissions, and core cloud infrastructure services.",
    },

    // Soft Skills
    {
      name: "Technical Communication",
      slug: "technical-communication",
      categorySlug: "soft-skills-leadership",
      description:
        "Clear documentation, architectural explanation, client reporting, and code walk-throughs.",
    },
    {
      name: "Problem Solving",
      slug: "problem-solving",
      categorySlug: "soft-skills-leadership",
      description:
        "Algorithmic reasoning, edge-case analysis, root-cause debugging, and structured thinking.",
    },
    {
      name: "Team Collaboration",
      slug: "team-collaboration",
      categorySlug: "soft-skills-leadership",
      description:
        "Pair programming, agile sprints, code reviews, and cross-functional team alignment.",
    },
  ];

  const skillMap = new Map<string, string>();
  for (const s of skillsData) {
    const categoryId = categoryMap.get(s.categorySlug);
    if (!categoryId) continue;

    const created = await prisma.skill.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        categoryId,
      },
      create: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        categoryId,
      },
    });
    skillMap.set(s.slug, created.id);
  }

  // ==========================================
  // 3. Seed Career Roles & Skill Requirements
  // ==========================================
  console.log("🎯 Seeding Career Roles & Benchmarks...");
  const careerRolesData = [
    {
      title: "Full Stack Developer",
      slug: "full-stack-developer",
      description:
        "Designs, implements, and maintains complete web applications spanning frontend UIs, backend services, and database layers.",
      category: "Software Engineering",
      avgSalary: "$85,000 - $120,000 / ₹8 - 18 LPA",
      demandLevel: DemandLevel.VERY_HIGH,
      skills: [
        { slug: "javascript", minProficiency: 70, weight: 1.2, isCore: true },
        { slug: "react", minProficiency: 70, weight: 1.2, isCore: true },
        { slug: "nodejs", minProficiency: 65, weight: 1.1, isCore: true },
        { slug: "postgresql", minProficiency: 60, weight: 1.0, isCore: true },
        { slug: "git-github", minProficiency: 60, weight: 0.9, isCore: true },
        { slug: "docker", minProficiency: 50, weight: 0.8, isCore: false },
        {
          slug: "technical-communication",
          minProficiency: 65,
          weight: 0.7,
          isCore: false,
        },
      ],
    },
    {
      title: "Frontend Engineer",
      slug: "frontend-engineer",
      description:
        "Specializes in user interfaces, responsive design, state management, web performance, and modern JavaScript/TypeScript ecosystems.",
      category: "Frontend Engineering",
      avgSalary: "$75,000 - $110,000 / ₹7 - 15 LPA",
      demandLevel: DemandLevel.HIGH,
      skills: [
        { slug: "javascript", minProficiency: 75, weight: 1.3, isCore: true },
        { slug: "typescript", minProficiency: 65, weight: 1.1, isCore: true },
        { slug: "react", minProficiency: 75, weight: 1.3, isCore: true },
        { slug: "html-css", minProficiency: 70, weight: 1.0, isCore: true },
        { slug: "git-github", minProficiency: 60, weight: 0.8, isCore: true },
        {
          slug: "technical-communication",
          minProficiency: 60,
          weight: 0.7,
          isCore: false,
        },
      ],
    },
    {
      title: "Backend Engineer",
      slug: "backend-engineer",
      description:
        "Focuses on server architecture, distributed databases, REST/GraphQL APIs, scalability, and robust security protocols.",
      category: "Backend Engineering",
      avgSalary: "$80,000 - $125,000 / ₹8 - 18 LPA",
      demandLevel: DemandLevel.VERY_HIGH,
      skills: [
        { slug: "nodejs", minProficiency: 75, weight: 1.3, isCore: true },
        { slug: "expressjs", minProficiency: 70, weight: 1.1, isCore: true },
        { slug: "postgresql", minProficiency: 70, weight: 1.2, isCore: true },
        { slug: "rest-apis", minProficiency: 75, weight: 1.2, isCore: true },
        { slug: "docker", minProficiency: 60, weight: 1.0, isCore: true },
        {
          slug: "problem-solving",
          minProficiency: 70,
          weight: 0.9,
          isCore: true,
        },
      ],
    },
    {
      title: "DevOps & Cloud Specialist",
      slug: "devops-cloud-specialist",
      description:
        "Orchestrates container infrastructure, CI/CD automation, cloud architecture (AWS), and production monitoring.",
      category: "Cloud Engineering",
      avgSalary: "$90,000 - $135,000 / ₹9 - 22 LPA",
      demandLevel: DemandLevel.HIGH,
      skills: [
        { slug: "docker", minProficiency: 75, weight: 1.3, isCore: true },
        {
          slug: "cicd-pipelines",
          minProficiency: 70,
          weight: 1.2,
          isCore: true,
        },
        { slug: "aws-cloud", minProficiency: 65, weight: 1.2, isCore: true },
        { slug: "git-github", minProficiency: 70, weight: 1.0, isCore: true },
        { slug: "python", minProficiency: 60, weight: 0.9, isCore: false },
      ],
    },
  ];

  for (const role of careerRolesData) {
    const createdRole = await prisma.careerRole.upsert({
      where: { slug: role.slug },
      update: {
        title: role.title,
        description: role.description,
        category: role.category,
        avgSalary: role.avgSalary,
        demandLevel: role.demandLevel,
      },
      create: {
        title: role.title,
        slug: role.slug,
        description: role.description,
        category: role.category,
        avgSalary: role.avgSalary,
        demandLevel: role.demandLevel,
      },
    });

    for (const req of role.skills) {
      const skillId = skillMap.get(req.slug);
      if (!skillId) continue;

      await prisma.careerRoleSkill.upsert({
        where: {
          careerRoleId_skillId: {
            careerRoleId: createdRole.id,
            skillId,
          },
        },
        update: {
          minProficiency: req.minProficiency,
          weight: req.weight,
          isCore: req.isCore,
        },
        create: {
          careerRoleId: createdRole.id,
          skillId,
          minProficiency: req.minProficiency,
          weight: req.weight,
          isCore: req.isCore,
        },
      });
    }
  }

  // ==========================================
  // 4. Seed Standardized Assessments & Questions
  // ==========================================
  console.log("📝 Seeding Assessments & Questions...");
  const jsAssessment = await prisma.assessment.upsert({
    where: { slug: "javascript-core-mastery" },
    update: {
      title: "JavaScript Core Mastery Assessment",
      description:
        "Comprehensive evaluation of JavaScript fundamentals, closures, promises, event loop, and DOM APIs.",
      categoryId: categoryMap.get("frontend-development")!,
      durationMinutes: 25,
      passingScore: 65.0,
    },
    create: {
      title: "JavaScript Core Mastery Assessment",
      slug: "javascript-core-mastery",
      description:
        "Comprehensive evaluation of JavaScript fundamentals, closures, promises, event loop, and DOM APIs.",
      categoryId: categoryMap.get("frontend-development")!,
      durationMinutes: 25,
      passingScore: 65.0,
    },
  });

  const jsSkillId = skillMap.get("javascript")!;
  const reactSkillId = skillMap.get("react")!;
  const nodeSkillId = skillMap.get("nodejs")!;

  const assessmentQuestions = [
    {
      assessmentId: jsAssessment.id,
      skillId: jsSkillId,
      questionText:
        "What is the output of the following JavaScript code snippet regarding variable hoisting?",
      codeSnippet: "console.log(a);\nvar a = 10;\nconsole.log(b);\nlet b = 20;",
      options: [
        "undefined, followed by ReferenceError",
        "undefined, followed by undefined",
        "ReferenceError, followed by ReferenceError",
        "10, followed by 20",
      ],
      correctOptionIndex: 0,
      explanation:
        "var declarations are hoisted with undefined initialization, while let/const declarations enter the Temporal Dead Zone (TDZ) causing a ReferenceError.",
      difficulty: DifficultyLevel.MEDIUM,
      weight: 1.0,
    },
    {
      assessmentId: jsAssessment.id,
      skillId: jsSkillId,
      questionText:
        "Which microtask/macrotask execution order applies to the JavaScript Event Loop?",
      codeSnippet: null,
      options: [
        "Microtasks execute after each macrotask before the next macrotask is dequeued",
        "Macrotasks always take priority over all pending microtasks",
        "Microtasks and macrotasks run in parallel via multi-threading",
        "Microtasks run only when the call stack and message queue are completely empty",
      ],
      correctOptionIndex: 0,
      explanation:
        "The event loop processes the entire microtask queue (Promises, queueMicrotask) before rendering and dequeuing the next macrotask (setTimeout, setInterval).",
      difficulty: DifficultyLevel.HARD,
      weight: 1.5,
    },
    {
      assessmentId: jsAssessment.id,
      skillId: jsSkillId,
      questionText:
        "What does the JavaScript closure mechanism allow a function to do?",
      codeSnippet: null,
      options: [
        "Retain access to variables from its parent lexical scope even after the parent function has closed",
        "Prevent garbage collection on all global variables automatically",
        "Execute asynchronously in a dedicated worker thread",
        "Convert private class fields into public properties",
      ],
      correctOptionIndex: 0,
      explanation:
        "A closure is the combination of a function bundled together with references to its surrounding lexical state (lexical environment).",
      difficulty: DifficultyLevel.EASY,
      weight: 1.0,
    },
  ];

  for (const q of assessmentQuestions) {
    const existing = await prisma.assessmentQuestion.findFirst({
      where: {
        assessmentId: q.assessmentId,
        questionText: q.questionText,
      },
    });

    if (!existing) {
      await prisma.assessmentQuestion.create({
        data: q,
      });
    }
  }

  // ==========================================
  // 5. Seed Learning Programs
  // ==========================================
  console.log("📚 Seeding Learning Programs...");
  const learningPrograms = [
    {
      title: "Modern Full-Stack JavaScript & React Mastery",
      slug: "modern-full-stack-javascript",
      description:
        "Complete hands-on masterclass covering modern ESNext, React hooks, state management, and real-world architectures.",
      provider: "SkillBridge Academy",
      url: "https://skillbridge.dev/learn/react-mastery",
      type: LearningType.COURSE,
      difficulty: DifficultyLevel.INTERMEDIATE as any,
      estimatedHours: 24,
      isFree: true,
      skills: [
        { slug: "javascript", targetLevel: ProficiencyLevel.ADVANCED },
        { slug: "react", targetLevel: ProficiencyLevel.ADVANCED },
      ],
    },
    {
      title: "Docker & Containerization Fundamentals for Developers",
      slug: "docker-containerization-fundamentals",
      description:
        "Master containerization from ground up: Dockerfiles, multi-stage builds, volume mounts, and containerized Node.js workflows.",
      provider: "Cloud Native Learning",
      url: "https://skillbridge.dev/learn/docker-fundamentals",
      type: LearningType.PROJECT_TUTORIAL,
      difficulty: DifficultyLevel.BEGINNER as any,
      estimatedHours: 12,
      isFree: true,
      skills: [{ slug: "docker", targetLevel: ProficiencyLevel.INTERMEDIATE }],
    },
    {
      title: "PostgreSQL Advanced Query Design & Optimization",
      slug: "postgresql-advanced-query-design",
      description:
        "In-depth guide to relational database modeling, indexing types (B-Tree, GIN), EXPLAIN ANALYZE, and query tuning.",
      provider: "Data Engineering Institute",
      url: "https://skillbridge.dev/learn/postgresql-optimization",
      type: LearningType.DOCUMENTATION,
      difficulty: DifficultyLevel.ADVANCED as any,
      estimatedHours: 18,
      isFree: true,
      skills: [
        { slug: "postgresql", targetLevel: ProficiencyLevel.ADVANCED },
        { slug: "sql-optimization", targetLevel: ProficiencyLevel.ADVANCED },
      ],
    },
  ];

  for (const prog of learningPrograms) {
    const { skills, ...progData } = prog;
    const createdProg = await prisma.learningProgram.upsert({
      where: { slug: prog.slug },
      update: progData,
      create: progData,
    });

    for (const s of skills) {
      const skillId = skillMap.get(s.slug);
      if (!skillId) continue;

      await prisma.learningProgramSkill.upsert({
        where: {
          learningProgramId_skillId: {
            learningProgramId: createdProg.id,
            skillId,
          },
        },
        update: { targetLevel: s.targetLevel },
        create: {
          learningProgramId: createdProg.id,
          skillId,
          targetLevel: s.targetLevel,
        },
      });
    }
  }

  // ==========================================
  // 6. Seed Sample Companies & Opportunities
  // ==========================================
  console.log("🏢 Seeding Companies & Opportunities...");

  // Create Company User 1
  const companyUser1 = await prisma.user.upsert({
    where: { email: "recruiter@techcorp.io" },
    update: {},
    create: {
      email: "recruiter@techcorp.io",
      passwordHash: defaultPassword,
      role: UserRole.INDUSTRY,
      isVerified: true,
    },
  });

  const company1 = await prisma.company.upsert({
    where: { userId: companyUser1.id },
    update: {},
    create: {
      userId: companyUser1.id,
      companyName: "TechCorp Innovations",
      industry: "Enterprise Software & Cloud Platforms",
      website: "https://techcorp.io",
      location: "Bangalore, India",
      description:
        "Global SaaS enterprise specializing in scalable cloud applications and high-throughput data platforms.",
      isVerified: true,
    },
  });

  // Create Company User 2
  const companyUser2 = await prisma.user.upsert({
    where: { email: "talent@cloudscale.dev" },
    update: {},
    create: {
      email: "talent@cloudscale.dev",
      passwordHash: defaultPassword,
      role: UserRole.INDUSTRY,
      isVerified: true,
    },
  });

  const company2 = await prisma.company.upsert({
    where: { userId: companyUser2.id },
    update: {},
    create: {
      userId: companyUser2.id,
      companyName: "CloudScale Systems",
      industry: "Cloud Infrastructure & DevOps Solutions",
      website: "https://cloudscale.dev",
      location: "Hyderabad, India",
      description:
        "Pioneering next-generation automated deployment pipelines and Kubernetes cluster infrastructure.",
      isVerified: true,
    },
  });

  // Opportunity 1: Frontend Developer Intern
  const opp1 = await prisma.opportunity.upsert({
    where: { id: "opp-frontend-intern-01" },
    update: {},
    create: {
      id: "opp-frontend-intern-01",
      companyId: company1.id,
      title: "Frontend Developer Intern",
      slug: "frontend-developer-intern-techcorp",
      type: OpportunityType.INTERNSHIP,
      description:
        "We are seeking an ambitious Frontend Developer Intern passionate about React, TypeScript, and high-performance UI engineering.",
      workMode: WorkMode.HYBRID,
      location: "Bangalore, India",
      minCgpa: 7.5,
      eligibleBranches: [
        "Computer Science",
        "Information Technology",
        "Electronics",
      ],
      eligibleGradYears: [2025, 2026],
      duration: "6 Months",
      stipendSalary: "₹35,000 / month",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      isActive: true,
    },
  });

  const opp1Skills = [
    { slug: "javascript", minScore: 70, isMandatory: true, weight: 1.2 },
    { slug: "react", minScore: 70, isMandatory: true, weight: 1.2 },
    { slug: "git-github", minScore: 55, isMandatory: false, weight: 0.8 },
    { slug: "html-css", minScore: 65, isMandatory: true, weight: 1.0 },
  ];

  for (const os of opp1Skills) {
    const skillId = skillMap.get(os.slug);
    if (!skillId) continue;
    await prisma.opportunitySkill.upsert({
      where: {
        opportunityId_skillId: {
          opportunityId: opp1.id,
          skillId,
        },
      },
      update: {
        minScore: os.minScore,
        isMandatory: os.isMandatory,
        weight: os.weight,
      },
      create: {
        opportunityId: opp1.id,
        skillId,
        minScore: os.minScore,
        isMandatory: os.isMandatory,
        weight: os.weight,
      },
    });
  }

  // Opportunity 2: Junior Backend Engineer
  const opp2 = await prisma.opportunity.upsert({
    where: { id: "opp-backend-engineer-02" },
    update: {},
    create: {
      id: "opp-backend-engineer-02",
      companyId: company1.id,
      title: "Junior Backend Engineer",
      slug: "junior-backend-engineer-techcorp",
      type: OpportunityType.FULL_TIME,
      description:
        "Build and scale RESTful APIs, manage PostgreSQL databases, and engineer resilient Node.js microservices.",
      workMode: WorkMode.REMOTE,
      location: "Remote, India",
      minCgpa: 7.0,
      eligibleBranches: ["Computer Science", "Information Technology"],
      eligibleGradYears: [2024, 2025],
      duration: "Full-time",
      stipendSalary: "₹8.5 - 12 LPA",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  const opp2Skills = [
    { slug: "nodejs", minScore: 70, isMandatory: true, weight: 1.3 },
    { slug: "expressjs", minScore: 65, isMandatory: true, weight: 1.1 },
    { slug: "postgresql", minScore: 65, isMandatory: true, weight: 1.2 },
    { slug: "docker", minScore: 50, isMandatory: false, weight: 0.8 },
  ];

  for (const os of opp2Skills) {
    const skillId = skillMap.get(os.slug);
    if (!skillId) continue;
    await prisma.opportunitySkill.upsert({
      where: {
        opportunityId_skillId: {
          opportunityId: opp2.id,
          skillId,
        },
      },
      update: {
        minScore: os.minScore,
        isMandatory: os.isMandatory,
        weight: os.weight,
      },
      create: {
        opportunityId: opp2.id,
        skillId,
        minScore: os.minScore,
        isMandatory: os.isMandatory,
        weight: os.weight,
      },
    });
  }

  // ==========================================
  // 7. Seed Sample Institution & Admin
  // ==========================================
  console.log("🏛️ Seeding Institution & Admin...");
  const institutionUser = await prisma.user.upsert({
    where: { email: "admin@apexuniversity.edu" },
    update: {},
    create: {
      email: "admin@apexuniversity.edu",
      passwordHash: defaultPassword,
      role: UserRole.INSTITUTION_ADMIN,
      isVerified: true,
    },
  });

  const institution = await prisma.institution.upsert({
    where: { userId: institutionUser.id },
    update: {},
    create: {
      userId: institutionUser.id,
      institutionName: "Apex Institute of Technology",
      code: "AIT-2024",
      location: "Pune, Maharashtra",
      website: "https://apexuniversity.edu",
      isVerified: true,
    },
  });

  // Super Admin User
  await prisma.user.upsert({
    where: { email: "superadmin@skillbridge.dev" },
    update: {},
    create: {
      email: "superadmin@skillbridge.dev",
      passwordHash: defaultPassword,
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
    },
  });

  // ==========================================
  // 8. Seed Sample Student Profile with Skills & Portfolio
  // ==========================================
  console.log("🎓 Seeding Sample Student & Skill Profile...");
  const studentUser = await prisma.user.upsert({
    where: { email: "alex.student@skillbridge.dev" },
    update: {},
    create: {
      email: "alex.student@skillbridge.dev",
      passwordHash: defaultPassword,
      role: UserRole.STUDENT,
      isVerified: true,
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {
      fullName: "Alex Morgan",
      headline: "Aspiring Full Stack Engineer & Open Source Contributor",
      college: "Apex Institute of Technology",
      branch: "Computer Science",
      gradYear: 2025,
      cgpa: 8.7,
      location: "Bangalore, India",
      bio: "Final year computer science student enthusiastic about modern React, TypeScript, scalable Node.js services, and explainable AI systems.",
      careerInterests: [
        "Full Stack Developer",
        "Frontend Engineer",
        "Backend Engineer",
      ],
      preferredLocations: ["Bangalore", "Hyderabad", "Remote"],
      workModePref: WorkMode.HYBRID,
      institutionId: institution.id,
    },
    create: {
      userId: studentUser.id,
      fullName: "Alex Morgan",
      headline: "Aspiring Full Stack Engineer & Open Source Contributor",
      college: "Apex Institute of Technology",
      branch: "Computer Science",
      gradYear: 2025,
      cgpa: 8.7,
      location: "Bangalore, India",
      bio: "Final year computer science student enthusiastic about modern React, TypeScript, scalable Node.js services, and explainable AI systems.",
      careerInterests: [
        "Full Stack Developer",
        "Frontend Engineer",
        "Backend Engineer",
      ],
      preferredLocations: ["Bangalore", "Hyderabad", "Remote"],
      workModePref: WorkMode.HYBRID,
      institutionId: institution.id,
    },
  });

  // Student Skills (Demonstrating verified strengths and gap areas)
  const studentSkillScores = [
    {
      slug: "javascript",
      score: 86.0,
      level: ProficiencyLevel.ADVANCED,
      verified: true,
    },
    {
      slug: "react",
      score: 78.0,
      level: ProficiencyLevel.ADVANCED,
      verified: true,
    },
    {
      slug: "nodejs",
      score: 74.0,
      level: ProficiencyLevel.ADVANCED,
      verified: true,
    },
    {
      slug: "postgresql",
      score: 62.0,
      level: ProficiencyLevel.INTERMEDIATE,
      verified: true,
    },
    {
      slug: "git-github",
      score: 55.0,
      level: ProficiencyLevel.INTERMEDIATE,
      verified: false,
    },
    {
      slug: "docker",
      score: 30.0,
      level: ProficiencyLevel.BEGINNER,
      verified: false,
    },
    {
      slug: "technical-communication",
      score: 81.0,
      level: ProficiencyLevel.ADVANCED,
      verified: true,
    },
  ];

  for (const ss of studentSkillScores) {
    const skillId = skillMap.get(ss.slug);
    if (!skillId) continue;

    await prisma.studentSkill.upsert({
      where: {
        studentId_skillId: {
          studentId: student.id,
          skillId,
        },
      },
      update: {
        score: ss.score,
        proficiency: ss.level,
        isVerified: ss.verified,
      },
      create: {
        studentId: student.id,
        skillId,
        score: ss.score,
        proficiency: ss.level,
        isVerified: ss.verified,
      },
    });
  }

  // Student Portfolio & Project
  await prisma.portfolio.upsert({
    where: { studentId: student.id },
    update: {},
    create: {
      studentId: student.id,
      customSlug: "alex-morgan",
      isPublic: true,
      aboutMe:
        "Passionate developer with hands-on experience in full-stack web applications, REST APIs, and database engineering.",
      themeColor: "#0C8EE9",
    },
  });

  const existingProject = await prisma.project.findFirst({
    where: { studentId: student.id, title: "Real-Time Analytics Dashboard" },
  });

  if (!existingProject) {
    await prisma.project.create({
      data: {
        studentId: student.id,
        title: "Real-Time Analytics Dashboard",
        description:
          "Built a high-performance analytics dashboard handling live data visualization with WebSockets, React, and Tailwind CSS.",
        liveUrl: "https://demo-analytics.skillbridge.dev",
        githubUrl: "https://github.com/alexmorgan/analytics-dash",
        skillsUsed: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
        isFeatured: true,
      },
    });
  }

  console.log("✅ SkillBridge Database Seed Complete!");
  console.log("📊 Summary of Seeded Data:");
  console.log(` - Categories: ${categories.length}`);
  console.log(` - Skills: ${skillsData.length}`);
  console.log(` - Career Roles: ${careerRolesData.length}`);
  console.log(` - Learning Programs: ${learningPrograms.length}`);
  console.log(` - Sample Opportunities: 2`);
  console.log(` - Test Accounts:`);
  console.log(`   * Student: alex.student@skillbridge.dev / Password123!`);
  console.log(`   * Recruiter: recruiter@techcorp.io / Password123!`);
  console.log(`   * Institution: admin@apexuniversity.edu / Password123!`);
  console.log(`   * Super Admin: superadmin@skillbridge.dev / Password123!`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
