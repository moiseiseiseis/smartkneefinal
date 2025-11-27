// sessions/sessions.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Prisma, Session } from '@prisma/client'; 

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}
  
  // 🔥 MÉTODO REQUERIDO POR EL CONTROLADOR: Crea una sesión enviada desde la app móvil.
  async createFromMobile(userId: string, data: any): Promise<Session> {
    
    // 1. 🔥 CORRECCIÓN CLAVE: BUSCAR EL REGISTRO DE PATIENT USANDO EL userId.
    const patientRecord = await this.prisma.patient.findUnique({
        where: { userId: userId }, // Buscar el Patient que está vinculado a este User ID
        select: { id: true }
    });

    if (!patientRecord) {
        // Lanzar error si el usuario autenticado no está en la tabla Patient (es Admin o Clinician, no paciente).
        throw new InternalServerErrorException('Patient record not found for this user ID. Cannot save session.');
    }

    const durationSeconds = data.durationSecs ? parseInt(data.durationSecs, 10) : 0;
    const startedAt = data.date ? new Date(data.date) : new Date();

    const sessionData: Prisma.SessionCreateInput = {
      // 2. CORRECCIÓN: Conectamos la sesión usando el ID INTERNO del registro Patient.
      patient: { connect: { id: patientRecord.id } }, 
      
      startedAt: startedAt,
      endedAt: new Date(startedAt.getTime() + durationSeconds * 1000), 
      
      durationSecs: durationSeconds,
      romMaxDeg: data.romMaxDeg,
      notes: data.notes,
      
      exerciseId: data.exerciseId,
      phaseLabel: data.phaseLabel,
      sessionType: data.sessionType, 
    };

    // 3. Crear el registro en la base de datos.
    return this.prisma.session.create({ data: sessionData });
  }


  // MÉTODOS EXISTENTES (list y get)
  
  list() {
    return this.prisma.session.findMany({
      include: { 
        patient: { 
          include: { 
            user: { 
              select: { 
                name: true, 
                email: true 
              } 
            } 
          } 
        } 
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  get(id: string) { 
    return this.prisma.session.findUnique({ 
      where: { id } 
    }); 
  }
}