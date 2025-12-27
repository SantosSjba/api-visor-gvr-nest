import { IsOptional, IsString } from 'class-validator';

export class ObtenerRecursosHijosDto {
    @IsOptional()
    @IsString()
    tipo?: string;
}

