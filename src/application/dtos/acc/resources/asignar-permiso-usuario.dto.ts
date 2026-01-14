import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AsignarPermisoUsuarioDto {
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    user_id: number;

    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    resource_id: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    permission_level_id?: number; // ID del nivel de permiso (default: 2 = "view_download")
}

