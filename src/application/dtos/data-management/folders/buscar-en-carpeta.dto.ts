import { IsOptional, IsObject } from 'class-validator';

export class BuscarEnCarpetaDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
