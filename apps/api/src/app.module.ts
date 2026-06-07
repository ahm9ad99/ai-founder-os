import { Module, Global } from '@nestjs/common'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { PrismaService } from './common/prisma.service'
import { AgentsModule } from './modules/agents/agents.module'
import { CodeReviewsModule } from './modules/code-reviews/code-reviews.module'
import { BusinessOpsModule } from './modules/business-ops/business-ops.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { CtoModule } from './modules/cto/cto.module'
import { AuthModule } from './modules/auth/auth.module'
import { HealthModule } from './modules/health/health.module'
import { PlanLimitsGuard } from './modules/auth/plan-limits.guard'

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    AgentsModule,
    CodeReviewsModule,
    BusinessOpsModule,
    ProjectsModule,
    CtoModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    PlanLimitsGuard,
    PrismaService,
  ],
  exports: [PrismaService],
})
export class AppModule {}
