import { IsNotEmpty, IsObject } from 'class-validator';

export class CrearDescargaDto {
    @IsNotEmpty()
    @IsObject()
    data: {
        formats: {
            fileType: string;
        };
    };
}
