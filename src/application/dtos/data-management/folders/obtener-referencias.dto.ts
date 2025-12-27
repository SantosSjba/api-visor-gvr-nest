import { IsOptional, IsObject } from 'class-validator';

export class ObtenerReferenciasDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
