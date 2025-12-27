import { IsOptional, IsObject } from 'class-validator';

export class ObtenerEstadoJobDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
