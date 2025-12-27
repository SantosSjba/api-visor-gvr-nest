import { IsNotEmpty, IsObject } from 'class-validator';

export class ActualizarVersionDto {
    @IsNotEmpty({ message: 'Los datos de actualización son requeridos' })
    @IsObject()
    data: Record<string, any>;
}


