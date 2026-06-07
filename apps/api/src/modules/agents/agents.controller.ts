import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AgentsService } from "./agents.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Agents")
@ApiBearerAuth()
@Controller("agents")
@UseGuards(AuthGuard("jwt"))
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  findAll() {
    return this.agentsService.findAll("org-placeholder");
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.agentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto, "user-placeholder", "org-placeholder");
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: Partial<CreateAgentDto>) {
    return this.agentsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.agentsService.remove(id);
  }

  @Get(":id/logs")
  getLogs(@Param("id") id: string) {
    return this.agentsService.getLogs(id);
  }
}
