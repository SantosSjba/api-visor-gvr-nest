import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class BuscarBusinessUnitsDto {
    @IsNotEmpty({ message: 'El término de búsqueda es requerido' })
    @IsString()
    term: string;

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}


