import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ProjectsService } from "./projects.service";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Projects")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(AuthGuard("jwt"))
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll("org-placeholder");
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projectsService.findOne(id);
  }

  @Get("audits/:id")
  getAudit(@Param("id") id: string) {
    return this.projectsService.getAudit(id);
  }
}
