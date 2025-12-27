import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CrearRecursoDto {
    @IsNotEmpty({ message: 'El external_id es requerido' })
    @IsString()
    external_id: string;

    @IsNotEmpty({ message: 'El resource_type es requerido' })
    @IsString()
    resource_type: string;

    @IsNotEmpty({ message: 'El name es requerido' })
    @IsString()
    name: string;

    @IsOptional()
    @IsInt()
    parent_id?: number;

    @IsOptional()
    @IsString()
    account_id?: string;
}

