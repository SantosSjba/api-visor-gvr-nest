import { IsInt, IsNotEmpty, IsArray, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SincronizarPermisosUsuarioDto {
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    user_id: number;

    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(0)
    @Type(() => Number)
    @IsInt({ each: true })
    @Min(1, { each: true })
    resource_ids: number[];
}

