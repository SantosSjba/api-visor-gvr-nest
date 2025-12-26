import { IsInt, IsOptional, IsNotEmpty } from 'class-validator';

export class MoverMenuDto {
    @IsNotEmpty({ message: 'El nuevo ID padre es requerido' })
    @IsInt()
    @IsOptional()
    id_padre_nuevo?: number;
}
