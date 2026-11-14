import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthedRequest } from "./auth.types.js";

// The signed-in user. Only works on routes that use AuthGuard.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
