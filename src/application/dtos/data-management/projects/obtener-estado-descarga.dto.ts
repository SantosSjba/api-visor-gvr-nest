import { IsOptional, IsObject } from 'class-validator';

export class ObtenerEstadoDescargaDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
