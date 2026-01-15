import { IsNotEmpty, IsObject } from 'class-validator';

export class ActualizarCarpetaDto {
    @IsNotEmpty()
    @IsObject()
    data: {
        type: string;
        id: string;
        attributes: {
            displayName?: string;
            name?: string;
            hidden?: boolean;
        };
    };
}
