import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from './auth.types.js';
import { FailureLimiter } from './failure-limiter.js';
import { dummyHash, hashPassword, verifyPassword } from './password.js';

const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
const ACCOUNT_MAX_FAILURES = 5; // per address + email
const IP_MAX_FAILURES = 20; // per address
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  private readonly limiter = new FailureLimiter(FAILURE_WINDOW_MS);

  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string, ip: string, userAgent?: string) {
    const accountKey = `acct:${ip}|${email}`;
    const ipKey = `ip:${ip}`;

    if (
      this.limiter.isBlocked(accountKey, ACCOUNT_MAX_FAILURES) ||
      this.limiter.isBlocked(ipKey, IP_MAX_FAILURES)
    ) {
      throw new HttpException(
        'Too many failed attempts. Try again in a few minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    let valid = false;
    if (user && user.active) {
      valid = await verifyPassword(password, user.passwordHash);
    } else {
      await verifyPassword(password, await dummyHash());
    }

    if (!user || !user.active || !valid) {
      this.limiter.recordFailure(accountKey);
      this.limiter.recordFailure(ipKey);
      throw new UnauthorizedException('Invalid email or password.');
    }

    this.limiter.clear(accountKey);

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_MS);

    await this.prisma.session.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
        userAgent: userAgent?.slice(0, 255),
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: this.toAuthUser(user),
    };
  }

  // Returns the session and user for a valid token, or null.
  async authenticate(
    token: string,
  ): Promise<{ id: string; user: AuthUser } | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date() || !session.user.active) {
      return null;
    }
    return { id: session.id, user: this.toAuthUser(session.user) };
  }

  async logout(sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  // Changing the password ends every other session of that user.
  async changePassword(
    userId: string,
    sessionId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'Choose a new password that is different from the current one.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    await this.prisma.session.deleteMany({
      where: { userId, id: { not: sessionId } },
    });
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'editor';
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
