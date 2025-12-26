import { IsString, IsInt, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateMenuDto {
    @IsNotEmpty({ message: 'El nombre del menú es requerido' })
    @IsString()
    @MaxLength(100)
    nombre: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    url?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    icono?: string;

    @IsOptional()
    @IsInt()
    idPadre?: number;

    @IsOptional()
    @IsInt()
    orden?: number;
}
