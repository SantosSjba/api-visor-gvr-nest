import { IsOptional, IsString, IsNumber, IsDateString, IsIn, MaxLength } from 'class-validator';

export class ActualizarProyectoBim360Dto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @IsString()
    project_type?: string;

    @IsOptional()
    @IsNumber()
    value?: number;

    @IsOptional()
    @IsString()
    @MaxLength(3)
    currency?: string;

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
    @IsIn(['US', 'EMEA'])
    region?: string;
}


