import { IsArray, IsInt, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class AsignarRolesMenuDto {
    @IsNotEmpty({ message: 'Los roles son requeridos' })
    @IsArray()
    @ArrayMinSize(1, { message: 'Debe proporcionar al menos un rol' })
    @IsInt({ each: true, message: 'Cada rol debe ser un número entero' })
    roles: number[];
}
