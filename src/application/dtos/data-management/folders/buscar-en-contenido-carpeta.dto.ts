import { IsOptional, IsString, IsObject } from 'class-validator';

export class BuscarEnContenidoCarpetaDto {
    @IsOptional()
    @IsString()
    searchName?: string;

    @IsOptional()
    @IsString()
    filterType?: string;

    @IsOptional()
    @IsString()
    extensionType?: string;

    @IsOptional()
    @IsObject()
    additionalFilters?: Record<string, any>;
}
