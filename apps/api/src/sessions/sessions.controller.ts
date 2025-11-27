// apps/api/src/sessions/sessions.controller.ts

import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  InternalServerErrorException, // Importación de la clase de excepción
  HttpCode // Importación para asegurar el código de respuesta
} from '@nestjs/common'; 
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  // POST /api/v1/sessions
  @Post()
  @HttpCode(201) // Aseguramos que la respuesta sea 201 Created
  async create(@Request() req, @Body() data: any) {
    
    // 🔥 CORRECCIÓN CLAVE: Extraemos el ID del paciente. 
    // Usamos 'sub' (el estándar JWT) o 'id', dependiendo de cómo el JwtStrategy adjunte el payload.
    const patientId = req.user?.id || req.user?.sub; 

    // 💡 VALIDACIÓN: Si no podemos encontrar el ID, lanzamos un error 500 explícito.
    if (!patientId) {
        // eslint-disable-next-line no-console
        console.error('[SESSIONS][ERROR] JWT Payload (req.user) is missing ID property.');
        throw new InternalServerErrorException('Authentication context missing.');
    }

    // eslint-disable-next-line no-console
    console.log(`[SESSIONS][POST] Sesión recibida para Patient ID: ${patientId}`);

    try {
      // Llamada al servicio para guardar en la DB (con el ID del paciente)
      const result = await this.svc.createFromMobile(patientId as string, data); 

      return {
        success: true,
        message: 'Session created successfully',
        data: result,
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[SESSIONS][ERROR] Error al intentar guardar sesión:', e);
      throw new InternalServerErrorException('No se pudo procesar la sesión en el servidor.');
    }
  }
  
  // GET /api/v1/sessions
  @Get()
  list() {
    return this.svc.list();
  }

  // GET /api/v1/sessions/:id
  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }
}