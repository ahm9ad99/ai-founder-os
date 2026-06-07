import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from "class-validator";
import { AgentModel } from "@ai-founder/db";

export class CreateAgentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AgentModel)
  model!: AgentModel;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;
}
