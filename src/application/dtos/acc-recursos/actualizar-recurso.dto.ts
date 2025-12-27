import { IsOptional, IsInt, IsString, IsObject, MaxLength } from 'class-validator';

export class ActualizarRecursoDto {
    @IsOptional()
    @IsInt()
    idusuario_asignado?: number;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    estado?: string;

    @IsOptional()
    @IsObject()
    metadatos?: any;
}

