import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TipoReporte {
    DETALLE_INCIDENCIA = 'issue_detail',
    RESUMEN_INCIDENCIAS = 'issue_summary',
    INCIDENCIAS_EN_PLANOS = 'issues_on_plans',
}

export enum FormatoExportacion {
    PDF = 'pdf',
    BCF = 'bcf',
}

export class ExportarIncidenciasDto {
    @IsString()
    @IsOptional()
    issueId?: string; // Para detalle de incidencia

    @IsEnum(TipoReporte)
    @IsNotEmpty()
    tipoReporte: TipoReporte;

    @IsEnum(FormatoExportacion)
    @IsNotEmpty()
    formato: FormatoExportacion;

    @IsString()
    @IsOptional()
    titulo?: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    guardarEnArchivos?: boolean;

    @IsString()
    @IsOptional()
    diseño?: string;

    // Opciones para incluir en el reporte
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    incluirCubierta?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    incluirIndice?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    incluirInformacionGeneralPlano?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    incluirCamposPersonalizados?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    incluirVinculosArchivo?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    incluirFotos?: boolean;

    @IsString()
    @IsOptional()
    tamañoFotos?: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    incluirOtrasReferencias?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    incluirComentarios?: boolean;

    // Para resumen o incidencias en planos
    @IsArray()
    @IsOptional()
    issueIds?: string[];

    // Filtros para exportar múltiples incidencias
    @IsString()
    @IsOptional()
    filter_status?: string;

    @IsString()
    @IsOptional()
    filter_linkedDocumentUrn?: string;

    // Información del usuario de la sesión
    @IsString()
    @IsOptional()
    usuarioNombre?: string;

    @IsString()
    @IsOptional()
    usuarioEmail?: string;
}
