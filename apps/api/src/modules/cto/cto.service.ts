import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class CtoService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.cTOSession.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.cTOSession.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!session) throw new NotFoundException("Session not found");
    return session;
  }

  async getStats(organizationId: string) {
    const [sessions, prds, roadmaps] = await Promise.all([
      this.prisma.cTOSession.count({ where: { organizationId } }),
      this.prisma.pRD.count({ where: { organizationId } }),
      this.prisma.roadmap.count({ where: { organizationId } }),
    ]);
    return { sessions, prds, roadmaps };
  }
}
