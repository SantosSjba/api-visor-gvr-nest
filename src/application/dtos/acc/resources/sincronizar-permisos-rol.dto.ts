import { IsInt, IsNotEmpty, IsArray } from 'class-validator';

export class SincronizarPermisosRolDto {
    @IsNotEmpty({ message: 'El role_id es requerido' })
    @IsInt()
    role_id: number;

    @IsNotEmpty({ message: 'Los resource_ids son requeridos' })
    @IsArray()
    @IsInt({ each: true })
    resource_ids: number[];
}

