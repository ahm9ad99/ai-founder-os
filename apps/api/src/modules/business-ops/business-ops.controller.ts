import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { BusinessOpsService } from './business-ops.service'
import { AuthGuard } from '../auth/auth.guard'
import { TicketPriority, TicketStatus } from '@ai-founder/db'

@ApiTags('Business Ops')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('business-ops')
export class BusinessOpsController {
  constructor(private readonly businessOpsService: BusinessOpsService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Get all customer tickets' })
  async getTickets(@Param('organizationId') organizationId: string) {
    return this.businessOpsService.getTickets(organizationId)
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a customer ticket' })
  async createTicket(@Body() body: { organizationId: string; subject: string; description?: string; customerEmail?: string; priority?: TicketPriority }) {
    return this.businessOpsService.createTicket(body)
  }

  @Put('tickets/:id')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateTicket(@Param('id') id: string, @Body() body: { status?: TicketStatus; assigneeId?: string }) {
    return this.businessOpsService.updateTicket(id, body)
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get invoices' })
  async getInvoices(@Param('organizationId') organizationId: string) {
    return this.businessOpsService.getInvoices(organizationId)
  }

  @Get('emails')
  @ApiOperation({ summary: 'Get email threads' })
  async getEmails(@Param('organizationId') organizationId: string) {
    return this.businessOpsService.getEmails(organizationId)
  }
}
