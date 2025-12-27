import { IsNotEmpty, IsObject } from 'class-validator';

export class CrearItemDto {
    @IsNotEmpty()
    @IsObject()
    data: any;

    included?: any[];
}

