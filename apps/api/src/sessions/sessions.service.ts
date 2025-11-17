import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}
  list() {
    return this.prisma.session.findMany({
      include: { patient: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { startedAt: 'desc' },
    });
  }
  get(id: string) { return this.prisma.session.findUnique({ where: { id } }); }
}
