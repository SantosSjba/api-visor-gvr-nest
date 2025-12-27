import { IsNotEmpty, IsArray, IsString, IsOptional, IsIn, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CompanyImportDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    name: string;

    @IsNotEmpty()
    @IsString()
    trade: string;

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
    website_url?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    description?: string;

    @IsOptional()
    @IsString()
    erp_id?: string;

    @IsOptional()
    @IsString()
    tax_id?: string;
}

export class ImportarCompaniesDto {
    @IsNotEmpty({ message: 'Las compañías son requeridas' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CompanyImportDto)
    companies: CompanyImportDto[];

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}


