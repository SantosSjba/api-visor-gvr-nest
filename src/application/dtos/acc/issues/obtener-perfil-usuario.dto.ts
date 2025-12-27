import { IsString } from 'class-validator';

export class ObtenerPerfilUsuarioDto {
    @IsString()
    projectId: string;
}


