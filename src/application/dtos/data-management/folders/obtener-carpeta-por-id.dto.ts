import { IsOptional, IsObject } from 'class-validator';

export class ObtenerCarpetaPorIdDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
