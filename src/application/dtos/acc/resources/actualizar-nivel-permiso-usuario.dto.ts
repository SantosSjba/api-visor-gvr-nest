import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ActualizarNivelPermisoUsuarioDto {
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    permission_level_id: number; // ID del nuevo nivel de permiso
}
