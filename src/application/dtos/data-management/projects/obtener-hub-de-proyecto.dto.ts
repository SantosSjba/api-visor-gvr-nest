import { IsOptional, IsObject } from 'class-validator';

export class ObtenerHubDeProyectoDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
