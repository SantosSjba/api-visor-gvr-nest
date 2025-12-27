import { IsNotEmpty, IsString, IsOptional, IsInt, IsBoolean, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscarUsuariosDto {
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    name: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;

    @IsOptional()
    @IsString()
    @IsIn(['and', 'or'])
    operator?: string;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    partial?: boolean;

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}

