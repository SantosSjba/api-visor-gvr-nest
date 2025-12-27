import { IsOptional, IsObject } from 'class-validator';

export class ObtenerCarpetaPadreDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
