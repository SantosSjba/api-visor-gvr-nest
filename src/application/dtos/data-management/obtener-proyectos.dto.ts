import { IsOptional, IsObject } from 'class-validator';

export class ObtenerProyectosDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
