import { Module } from '@nestjs/common'
import { CodeReviewsController } from './code-reviews.controller'
import { CodeReviewsService } from './code-reviews.service'

@Module({
  controllers: [CodeReviewsController],
  providers: [CodeReviewsService],
})
export class CodeReviewsModule {}
