import { IsNotEmpty, IsObject } from 'class-validator';

export class CrearReferenciaDto {
    @IsNotEmpty({ message: 'Los datos de la referencia son requeridos' })
    @IsObject()
    data: Record<string, any>;
}

