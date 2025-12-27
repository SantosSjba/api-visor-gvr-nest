import { IsOptional, IsString, IsIn } from 'class-validator';

export class ObtenerProyectosLegacyDto {
    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;

    // Cualquier otro filtro opcional se pasa como query params
    [key: string]: any;
}


