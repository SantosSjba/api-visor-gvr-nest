import { IsNotEmpty, IsObject } from 'class-validator';

export class CrearStorageDto {
    @IsNotEmpty()
    @IsObject()
    data: {
        type: string;
        attributes: {
            name: string;
        };
        relationships: {
            target: {
                data: {
                    type: string;
                    id: string;
                };
            };
        };
    };
}
