import { IsNotEmpty, IsObject } from 'class-validator';

export class CrearVersionDto {
    @IsNotEmpty({ message: 'Los datos de la versión son requeridos' })
    @IsObject()
    data: Record<string, any>;
}


