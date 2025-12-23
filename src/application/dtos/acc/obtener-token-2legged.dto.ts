import { IsArray, IsOptional, IsString } from 'class-validator';

export class ObtenerToken2LeggedDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    scopes?: string[];
}
