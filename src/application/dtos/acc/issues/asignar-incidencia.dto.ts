import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class AsignarIncidenciaDto {
    @IsString()
    @IsNotEmpty()
    issueId: string;

    @IsInt()
    @IsOptional()
    userId?: number | null; // null para desasignar
}

