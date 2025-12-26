import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreatePermisoDto {
    @IsNotEmpty({ message: 'El nombre del permiso es requerido' })
    @IsString()
    @MaxLength(255)
    nombre: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    descripcion?: string;
}
