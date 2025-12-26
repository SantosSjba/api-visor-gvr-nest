import { IsArray, IsInt, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class AsignarPermisosDto {
    @IsNotEmpty({ message: 'Los permisos son requeridos' })
    @IsArray()
    @ArrayMinSize(1, { message: 'Debe proporcionar al menos un permiso' })
    @IsInt({ each: true, message: 'Cada permiso debe ser un número entero' })
    permisos: number[];
}
