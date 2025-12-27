import { IsNotEmpty, IsObject } from 'class-validator';

export class CrearReferenciaDto {
    @IsNotEmpty()
    @IsObject()
    data: {
        type: string;
        id?: string;
        meta: {
            extension?: {
                type: string;
                version: string;
            };
        };
    };
}
