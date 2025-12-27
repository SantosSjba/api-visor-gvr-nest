import { IsNotEmpty, IsString, IsDateString, IsNumber, IsOptional, IsBoolean, IsIn, MaxLength } from 'class-validator';

export class CrearProyectoBim360Dto {
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    @MaxLength(255)
    name: string;

    @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
    @IsDateString()
    start_date: string;

    @IsNotEmpty({ message: 'La fecha de fin es requerida' })
    @IsDateString()
    end_date: string;

    @IsNotEmpty({ message: 'El tipo de proyecto es requerido' })
    @IsString()
    project_type: string;

    @IsNotEmpty({ message: 'El valor es requerido' })
    @IsNumber()
    value: number;

    @IsNotEmpty({ message: 'La moneda es requerida' })
    @IsString()
    @MaxLength(3)
    currency: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    job_number?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    address_line_1?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    state_or_province?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    postal_code?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsString()
    construction_type?: string;

    @IsOptional()
    @IsString()
    contract_type?: string;

    @IsOptional()
    @IsString()
    template_project_id?: string;

    @IsOptional()
    @IsBoolean()
    include_locations?: boolean;

    @IsOptional()
    @IsBoolean()
    include_companies?: boolean;

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}

