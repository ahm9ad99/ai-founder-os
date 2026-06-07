import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header')
    }

    const [type, token] = authHeader.split(' ')

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format')
    }

    request.userId = token
    return true
  }
}
