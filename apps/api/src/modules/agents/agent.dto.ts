import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator'

export class CreateAgentDto {
  @ApiProperty()
  @IsString()
  name!: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: ['GPT4_O', 'CLAUDE_35_SONNET', 'GEMINI_PRO'], default: 'GPT4_O' })
  @IsOptional()
  @IsString()
  model?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  systemPrompt?: string

  @ApiProperty({ required: false, default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number

  @ApiProperty({ required: false, default: 4096 })
  @IsOptional()
  @IsNumber()
  maxTokens?: number

  @IsString()
  userId!: string

  @IsString()
  organizationId!: string
}

export class UpdateAgentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  systemPrompt?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  temperature?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxTokens?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string
}
