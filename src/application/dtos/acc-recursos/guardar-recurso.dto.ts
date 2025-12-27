import { IsNotEmpty, IsString, IsOptional, IsInt, IsObject, MaxLength } from 'class-validator';

export class GuardarRecursoDto {
    @IsNotEmpty({ message: 'El tipo de recurso es requerido' })
    @IsString()
    @MaxLength(50)
    recurso_tipo: string;

    @IsNotEmpty({ message: 'El ID del recurso es requerido' })
    @IsString()
    @MaxLength(255)
    recurso_id: string;

    @IsOptional()
    @IsString()
    recurso_urn?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    project_id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    parent_id?: string;

    @IsNotEmpty({ message: 'El ID del usuario creador es requerido' })
    @IsInt()
    idusuario_creador: number;

    @IsOptional()
    @IsInt()
    idusuario_asignado?: number;

    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    estado?: string;

    @IsOptional()
    @IsObject()
    metadatos?: any;
}

