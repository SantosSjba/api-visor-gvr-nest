import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class GestionarRolesUsuarioDto {
    @IsNotEmpty({ message: 'Los roles son requeridos' })
    @IsArray()
    @IsInt({ each: true, message: 'Cada rol debe ser un número entero' })
    rolesIds: number[];
}
