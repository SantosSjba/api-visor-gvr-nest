import { IsNotEmpty, IsArray, IsString, IsOptional, IsInt, Min, Max, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProyectosPorTipoDto {
    @IsNotEmpty({ message: 'El array de tipos es requerido' })
    @IsArray()
    @ArrayMinSize(1, { message: 'Debe proporcionar al menos un tipo de proyecto' })
    @IsString({ each: true })
    tipos: string[];

    @IsOptional()
    @IsString()
    fields?: string;

    @IsOptional()
    @IsString()
    filter_status?: string;

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number = 20;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;

    @IsOptional()
    @IsString()
    token?: string;
}
