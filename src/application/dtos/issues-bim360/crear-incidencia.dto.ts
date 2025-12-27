import { IsString, IsOptional, IsObject, IsBoolean, IsNumber } from 'class-validator';

export class CrearIncidenciaDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    issueSubtypeId?: string;

    @IsOptional()
    @IsString()
    dueDate?: string;

    @IsOptional()
    @IsString()
    assignedTo?: string;

    @IsOptional()
    @IsString()
    assignedToType?: string;

    @IsOptional()
    @IsString()
    rootCauseId?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    locationId?: string;

    @IsOptional()
    @IsString()
    locationDetails?: string;

    @IsOptional()
    @IsObject()
    linkedDocuments?: any[];
}

