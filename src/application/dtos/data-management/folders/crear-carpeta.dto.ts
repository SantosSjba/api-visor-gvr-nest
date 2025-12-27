import { IsNotEmpty, IsObject } from 'class-validator';

export class CrearCarpetaDto {
    @IsNotEmpty()
    @IsObject()
    data: {
        type: string;
        attributes: {
            name: string;
            extension?: {
                type: string;
                version: string;
            };
        };
        relationships: {
            parent: {
                data: {
                    type: string;
                    id: string;
                };
            };
        };
    };
}
