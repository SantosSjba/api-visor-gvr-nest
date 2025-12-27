import { IsOptional, IsString, IsIn, IsDateString, MaxLength, IsUUID, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProjectValueDto {
    @IsOptional()
    @IsNumber()
    value?: number;

    @IsOptional()
    @IsString()
    @MaxLength(3)
    currency?: string;
}

export class ActualizarProyectoDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    type?: string;

    @IsOptional()
    @IsString()
    @IsIn(['production', 'template', 'component', 'sample'])
    classification?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    jobNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    addressLine1?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    addressLine2?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    stateOrProvince?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    postalCode?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    country?: string;

    @IsOptional()
    @IsString()
    @MaxLength(25)
    latitude?: string;

    @IsOptional()
    @IsString()
    @MaxLength(25)
    longitude?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    constructionType?: string;

    @IsOptional()
    @IsString()
    deliveryMethod?: string;

    @IsOptional()
    @IsString()
    contractType?: string;

    @IsOptional()
    @IsString()
    currentPhase?: string;

    @IsOptional()
    @IsUUID()
    businessUnitId?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ProjectValueDto)
    projectValue?: ProjectValueDto;

    @IsOptional()
    @IsString()
    token?: string;
}
