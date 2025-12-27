import { IsOptional, IsObject } from 'class-validator';

export class ObtenerProyectoPorIdDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
