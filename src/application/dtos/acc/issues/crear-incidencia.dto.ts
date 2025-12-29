import { IsString, IsOptional, IsObject, IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class PushpinPositionDto {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsNumber()
    z: number;
}

class ViewerStateDto {
    @IsOptional()
    @IsObject()
    viewport?: any;

    @IsOptional()
    @IsArray()
    objectSet?: any[];

    @IsOptional()
    @IsObject()
    renderOptions?: any;
}

class LinkedDocumentDetailsDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => PushpinPositionDto)
    position?: PushpinPositionDto;

    @IsOptional()
    @IsNumber()
    objectId?: number;

    @IsOptional()
    @IsString()
    externalId?: string;

    @IsOptional()
    @IsObject()
    viewable?: {
        id: string;
        viewableId: string;
        guid: string;
        name: string;
        is3D: boolean;
    };

    @IsOptional()
    @IsObject()
    viewerState?: ViewerStateDto;
}

export class CrearIncidenciaDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsString()
    issueSubtypeId: string;

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
    @IsString()
    thumbnail?: string;

    @IsOptional()
    @IsString()
    documentUrn?: string;

    @IsOptional()
    @IsString()
    itemId?: string;

    @IsOptional()
    @IsNumber()
    objectId?: number;

    @IsOptional()
    @IsString()
    externalId?: string;

    @IsOptional()
    @IsString()
    viewableGuid?: string;

    @IsOptional()
    @IsString()
    viewableName?: string;

    @IsOptional()
    @IsBoolean()
    is3D?: boolean;

    @IsOptional()
    @ValidateNested()
    @Type(() => PushpinPositionDto)
    pushpinPosition?: PushpinPositionDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => ViewerStateDto)
    viewerState?: ViewerStateDto;
}


