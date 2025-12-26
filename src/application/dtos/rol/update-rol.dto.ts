import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateRolDto {
    @IsNotEmpty({ message: 'El nombre del rol es requerido' })
    @IsString()
    @MaxLength(255)
    nombre: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    descripcion?: string;
}
