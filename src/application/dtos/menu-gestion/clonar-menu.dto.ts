import { IsString, IsInt, IsOptional, IsBoolean, MaxLength, IsNotEmpty } from 'class-validator';

export class ClonarMenuDto {
    @IsNotEmpty({ message: 'El nuevo nombre es requerido' })
    @IsString()
    @MaxLength(100)
    nombre_nuevo: string;

    @IsOptional()
    @IsInt()
    id_padre_nuevo?: number;

    @IsOptional()
    @IsBoolean()
    clonar_roles?: boolean;
}
