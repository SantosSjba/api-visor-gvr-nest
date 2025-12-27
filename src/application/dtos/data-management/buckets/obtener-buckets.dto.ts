import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ObtenerBucketsDto {
    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA', 'AP'])
    region?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @IsString()
    startAt?: string;
}

