import { IsString, IsNotEmpty, IsArray, IsInt, IsOptional, ValidateIf } from 'class-validator';

export class AsignarIncidenciaDto {
    @IsString()
    @IsNotEmpty()
    issueId: string;

    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    @ValidateIf((o) => o.userIds !== undefined)
    userIds?: number[]; // Array de IDs de usuarios a asignar. Array vacío [] para desasignar todos

    // Mantener compatibilidad con versión anterior (un solo usuario)
    @IsInt()
    @IsOptional()
    userId?: number | null; // null para desasignar (deprecated, usar userIds: [] para desasignar)
}

