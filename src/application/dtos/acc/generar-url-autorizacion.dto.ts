import { IsArray, IsOptional, IsString } from 'class-validator';

export class GenerarUrlAutorizacionDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    scopes?: string[];
}
