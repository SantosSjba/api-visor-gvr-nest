import { IsOptional } from 'class-validator';

export class ObtenerProyectosNewDto {
    // Cualquier filtro opcional se pasa como query params
    [key: string]: any;
}

