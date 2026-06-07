import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateAgentDto } from "./dto/create-agent.dto";

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.agent.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { logs: true } } },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
    if (!agent) throw new NotFoundException("Agent not found");
    return agent;
  }

  async create(dto: CreateAgentDto, userId: string, organizationId: string) {
    return this.prisma.agent.create({
      data: {
        name: dto.name,
        description: dto.description,
        model: dto.model,
        systemPrompt: dto.systemPrompt,
        temperature: dto.temperature ?? 0.7,
        createdBy: userId,
        organizationId,
      },
    });
  }

  async update(id: string, dto: Partial<CreateAgentDto>) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException("Agent not found");
    return this.prisma.agent.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException("Agent not found");
    return this.prisma.agent.delete({ where: { id } });
  }

  async getLogs(agentId: string) {
    return this.prisma.agentLog.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
