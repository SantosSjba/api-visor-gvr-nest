import { IsString, IsInt, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateEmpresaDto {
    @IsNotEmpty({ message: 'La razón social es requerida' })
    @IsString()
    @MaxLength(255)
    razonSocial: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    nombreComercial?: string;

    @IsNotEmpty({ message: 'El tipo de documento es requerido' })
    @IsInt()
    idTipoDocumento: number;

    @IsNotEmpty({ message: 'El número de documento es requerido' })
    @IsString()
    @MaxLength(50)
    nroDocumento: string;
}
