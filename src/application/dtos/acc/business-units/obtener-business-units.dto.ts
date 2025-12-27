import { IsOptional, IsString, IsIn } from 'class-validator';

export class ObtenerBusinessUnitsDto {
    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}

