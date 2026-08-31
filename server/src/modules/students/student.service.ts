import { AuditAction, ProficiencyLevel } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { UpdateStudentProfileInput } from "./student.schema.js";
import { AppError } from "../../middleware/error.middleware.js";

export class StudentService {
  /**
   * Fetch student profile for the authenticated user
   */
  async getProfileByUserId(userId: string) {
    let student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true,
            createdAt: true,
          },
        },
        skills: {
          include: {
            skill: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: {
            score: "desc",
          },
        },
        projects: {
          orderBy: { createdAt: "desc" },
        },
        certifications: {
          orderBy: { issueDate: "desc" },
        },
        portfolio: true,
        institution: {
          select: {
            id: true,
            institutionName: true,
            code: true,
            location: true,
          },
        },
      },
    });

    // Auto-create student profile if user has role STUDENT but profile doesn't exist
    if (!student) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        const error: AppError = new Error("User account not found.");
        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
      }

      student = await prisma.student.create({
        data: {
          userId,
          fullName: user.email.split("@")[0],
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isVerified: true,
              createdAt: true,
            },
          },
          skills: {
            include: {
              skill: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          projects: true,
          certifications: true,
          portfolio: true,
          institution: true,
        },
      });
    }

    return student;
  }

  /**
   * Update student profile fields and optionally synchronize selected skills
   */
  async updateProfileByUserId(
    userId: string,
    input: UpdateStudentProfileInput,
  ) {
    const student = await this.getProfileByUserId(userId);

    const { selectedSkillIds, ...profileData } = input;

    // Perform update in a transaction
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // 1. Update Student Table
      const updated = await tx.student.update({
        where: { id: student.id },
        data: {
          ...(profileData.fullName !== undefined && {
            fullName: profileData.fullName,
          }),
          ...(profileData.headline !== undefined && {
            headline: profileData.headline,
          }),
          ...(profileData.phone !== undefined && { phone: profileData.phone }),
          ...(profileData.location !== undefined && {
            location: profileData.location,
          }),
          ...(profileData.college !== undefined && {
            college: profileData.college,
          }),
          ...(profileData.branch !== undefined && {
            branch: profileData.branch,
          }),
          ...(profileData.gradYear !== undefined && {
            gradYear: profileData.gradYear,
          }),
          ...(profileData.cgpa !== undefined && { cgpa: profileData.cgpa }),
          ...(profileData.bio !== undefined && { bio: profileData.bio }),
          ...(profileData.careerInterests !== undefined && {
            careerInterests: profileData.careerInterests,
          }),
          ...(profileData.preferredLocations !== undefined && {
            preferredLocations: profileData.preferredLocations,
          }),
          ...(profileData.workModePref !== undefined && {
            workModePref: profileData.workModePref,
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isVerified: true,
            },
          },
          skills: {
            include: {
              skill: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      // 2. Synchronize Skills if selectedSkillIds provided
      if (selectedSkillIds && Array.isArray(selectedSkillIds)) {
        // Fetch existing student skills
        const existingStudentSkills = await tx.studentSkill.findMany({
          where: { studentId: student.id },
        });

        const existingSkillIds = new Set(
          existingStudentSkills.map((s) => s.skillId),
        );
        const newSkillIds = new Set(selectedSkillIds);

        // Add newly selected skills with default beginner score if not yet assessed
        for (const skillId of selectedSkillIds) {
          if (!existingSkillIds.has(skillId)) {
            await tx.studentSkill.create({
              data: {
                studentId: student.id,
                skillId,
                score: 50.0, // Initial self-declared baseline score
                proficiency: ProficiencyLevel.INTERMEDIATE,
                isVerified: false,
              },
            });
          }
        }
      }

      // 3. Record Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          entityType: "StudentProfile",
          entityId: student.id,
          details: { updatedFields: Object.keys(input) },
        },
      });

      return updated;
    });

    // Re-fetch complete profile
    return this.getProfileByUserId(userId);
  }

  /**
   * Fetch public view of student profile by student ID
   */
  async getProfileById(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        skills: {
          include: {
            skill: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            score: "desc",
          },
        },
        projects: {
          orderBy: { createdAt: "desc" },
        },
        certifications: {
          orderBy: { issueDate: "desc" },
        },
        portfolio: true,
      },
    });

    if (!student) {
      const error: AppError = new Error("Student profile not found.");
      error.statusCode = 404;
      error.code = "STUDENT_NOT_FOUND";
      throw error;
    }

    return student;
  }
}

export const studentService = new StudentService();
