import { IsString } from 'class-validator';

export class CrearComentarioDto {
    @IsString()
    body: string;
}


