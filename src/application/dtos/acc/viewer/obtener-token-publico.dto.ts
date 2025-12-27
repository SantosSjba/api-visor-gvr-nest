import { IsNotEmpty, IsString } from 'class-validator';

export class ObtenerTokenPublicoDto {
    @IsNotEmpty()
    @IsString()
    urn: string;
}
