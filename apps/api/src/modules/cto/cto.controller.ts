import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CtoService } from "./cto.service";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("CTO Platform")
@ApiBearerAuth()
@Controller("cto")
@UseGuards(AuthGuard("jwt"))
export class CtoController {
  constructor(private ctoService: CtoService) {}

  @Get()
  findAll() {
    return this.ctoService.findAll("org-placeholder");
  }

  @Get("stats")
  getStats() {
    return this.ctoService.getStats("org-placeholder");
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ctoService.findOne(id);
  }
}
