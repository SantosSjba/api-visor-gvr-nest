import { IsString, IsInt, IsOptional, IsNumber, IsDateString, MaxLength, IsNotEmpty, Min } from 'class-validator';

export class UpdateProyectoDto {
    @IsNotEmpty({ message: 'El nombre del proyecto es requerido' })
    @IsString()
    @MaxLength(255)
    nombreProyecto: string;

    @IsNotEmpty({ message: 'El número de proyecto es requerido' })
    @IsString()
    @MaxLength(100)
    nroProyecto: string;

    @IsNotEmpty({ message: 'El tipo de proyecto es requerido' })
    @IsInt()
    idTipoProyecto: number;

    @IsNotEmpty({ message: 'El país es requerido' })
    @IsInt()
    idPais: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    direccion1?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    direccion2?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    ciudad?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    provincia?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    codigoPostal?: string;

    @IsOptional()
    @IsInt()
    idZonaHoraria?: number;

    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFinalizacion?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    valorProyecto?: number;

    @IsOptional()
    @IsInt()
    idTipoMoneda?: number;
}
