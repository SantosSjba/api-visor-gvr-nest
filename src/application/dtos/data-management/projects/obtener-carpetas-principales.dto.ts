import { IsOptional, IsObject } from 'class-validator';

export class ObtenerCarpetasPrincipalesDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
