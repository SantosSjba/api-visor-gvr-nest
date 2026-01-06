import { IsInt, IsNotEmpty, Min } from 'class-validator';
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
}

