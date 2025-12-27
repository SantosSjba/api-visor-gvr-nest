import { IsOptional, IsObject } from 'class-validator';

export class ObtenerRelacionesRefsDto {
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;
}
