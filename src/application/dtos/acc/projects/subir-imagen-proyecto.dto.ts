import { IsOptional, IsString } from 'class-validator';

export class SubirImagenProyectoDto {
    @IsOptional()
    @IsString()
    token?: string;
}
