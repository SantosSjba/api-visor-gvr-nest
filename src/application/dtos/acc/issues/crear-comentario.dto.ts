import { IsString, IsOptional } from 'class-validator';

export class CrearComentarioDto {
    @IsString()
    body: string;

    @IsOptional()
    @IsString()
    issueId?: string;
}


