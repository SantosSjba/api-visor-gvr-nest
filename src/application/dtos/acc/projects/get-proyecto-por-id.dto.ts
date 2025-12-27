import { IsOptional, IsString } from 'class-validator';

export class GetProyectoPorIdDto {
    @IsOptional()
    @IsString()
    fields?: string;

    @IsOptional()
    @IsString()
    token?: string;
}
