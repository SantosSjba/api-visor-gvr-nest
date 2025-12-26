import { IsInt, IsNotEmpty } from 'class-validator';

export class AsignarRolMenuDto {
    @IsNotEmpty({ message: 'El ID del rol es requerido' })
    @IsInt()
    id_rol: number;
}
