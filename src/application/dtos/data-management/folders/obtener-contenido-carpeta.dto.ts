import { IsOptional, IsObject } from 'class-validator';

export class ObtenerContenidoCarpetaDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
