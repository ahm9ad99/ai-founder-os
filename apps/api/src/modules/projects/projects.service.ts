import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { audits: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        audits: { orderBy: { createdAt: "desc" } },
        businessTasks: true,
      },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async getAudit(id: string) {
    const audit = await this.prisma.audit.findUnique({
      where: { id },
    });
    if (!audit) throw new NotFoundException("Audit not found");
    return audit;
  }
}
