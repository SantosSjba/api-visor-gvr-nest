import { IsInt, IsNotEmpty } from 'class-validator';

export class ReordenarMenuDto {
    @IsNotEmpty({ message: 'El nuevo orden es requerido' })
    @IsInt()
    orden_nuevo: number;
}
