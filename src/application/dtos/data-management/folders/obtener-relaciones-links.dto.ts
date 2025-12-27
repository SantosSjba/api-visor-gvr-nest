import { IsOptional, IsObject } from 'class-validator';

export class ObtenerRelacionesLinksDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
