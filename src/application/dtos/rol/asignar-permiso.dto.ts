import { IsInt, IsNotEmpty } from 'class-validator';

export class AsignarPermisoDto {
    @IsNotEmpty({ message: 'El ID del permiso es requerido' })
    @IsInt()
    id_permiso: number;
}
