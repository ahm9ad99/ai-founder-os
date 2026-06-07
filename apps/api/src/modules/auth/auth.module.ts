import { Module } from '@nestjs/common'
import { AuthGuard } from './auth.guard'
import { ApiKeyGuard } from './api-key.guard'

@Module({
  providers: [AuthGuard, ApiKeyGuard],
  exports: [AuthGuard, ApiKeyGuard],
})
export class AuthModule {}
