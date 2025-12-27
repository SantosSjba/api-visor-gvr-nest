import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

export class ActualizarUsuarioDto {
    @IsOptional()
    @IsString()
    company_id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    nickname?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    first_name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    last_name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    image_url?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    address_line_1?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    address_line_2?: string;

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
    @MaxLength(255)
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    company?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    job_title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    industry?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    about_me?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    default_role?: string;

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}


