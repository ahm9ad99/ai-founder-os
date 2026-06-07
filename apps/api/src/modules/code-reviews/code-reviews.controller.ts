import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CodeReviewsService } from './code-reviews.service'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Code Reviews')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('code-reviews')
export class CodeReviewsController {
  constructor(private readonly codeReviewsService: CodeReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all code reviews' })
  async findAll(@Param('organizationId') organizationId: string) {
    return this.codeReviewsService.findAll(organizationId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  async findOne(@Param('id') id: string) {
    return this.codeReviewsService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new code review' })
  async create(@Body() body: { organizationId: string; pullRequestId?: string; prTitle: string }) {
    return this.codeReviewsService.create(body)
  }
}
