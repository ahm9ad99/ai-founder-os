import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { prisma } from '@ai-founder/db'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key']

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key')
    }

    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey as string },
    })

    if (!key) {
      throw new UnauthorizedException('Invalid API key')
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired')
    }

    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    })

    request.organizationId = key.organizationId
    return true
  }
}
