import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class ActualizarRecursoDto {
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

