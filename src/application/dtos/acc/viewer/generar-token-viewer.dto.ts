import { IsOptional, IsString } from 'class-validator';

export class GenerarTokenViewerDto {
    @IsOptional()
    @IsString()
    scope?: string;
}
