import { IsOptional, IsString, IsIn } from 'class-validator';

export class ObtenerBusinessUnitsHijasDto {
    @IsOptional()
    @IsString()
    parent_id?: string;

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}


