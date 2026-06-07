import { Module } from "@nestjs/common";
import { CtoController } from "./cto.controller";
import { CtoService } from "./cto.service";

@Module({
  controllers: [CtoController],
  providers: [CtoService],
  exports: [CtoService],
})
export class CtoModule {}
