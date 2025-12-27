import { IsInt, IsNotEmpty } from 'class-validator';

export class AsignarPermisoDto {
    @IsNotEmpty({ message: 'El role_id es requerido' })
    @IsInt()
    role_id: number;

    @IsNotEmpty({ message: 'El resource_id es requerido' })
    @IsInt()
    resource_id: number;
}

