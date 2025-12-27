import { IsString, IsOptional } from 'class-validator';

export class CrearComentarioDto {
    @IsString()
    comment: string;

    @IsOptional()
    @IsString()
    issueId?: string;
}


