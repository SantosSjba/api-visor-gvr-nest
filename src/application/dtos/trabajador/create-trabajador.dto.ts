import { IsString, IsInt, IsEmail, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateTrabajadorDto {
    @IsNotEmpty({ message: 'Los nombres son requeridos' })
    @IsString()
    @MaxLength(255)
    nombres: string;

    @IsNotEmpty({ message: 'Los apellidos son requeridos' })
    @IsString()
    @MaxLength(255)
    apellidos: string;

    @IsNotEmpty({ message: 'El tipo de documento es requerido' })
    @IsInt()
    idTipoDocumento: number;

    @IsNotEmpty({ message: 'El número de documento es requerido' })
    @IsString()
    @MaxLength(50)
    nroDocumento: string;

    @IsNotEmpty({ message: 'El correo es requerido' })
    @IsEmail({}, { message: 'El correo no es válido' })
    @MaxLength(255)
    correo: string;

    @IsNotEmpty({ message: 'La empresa es requerida' })
    @IsInt()
    idEmpresa: number;

    @IsOptional()
    @IsInt()
    idResponsable?: number;

    @IsOptional()
    @IsInt()
    idRol?: number;
}
