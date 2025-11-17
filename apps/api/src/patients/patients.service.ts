import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}
  list() {
    return this.prisma.patient.findMany({
      include: { user: { select: { id:true, email:true, name:true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  get(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: { user: { select: { id:true, email:true, name:true } }, devices: true, sessions: true },
    });
  }
}
