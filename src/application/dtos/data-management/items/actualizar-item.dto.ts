import { IsNotEmpty, IsObject } from 'class-validator';

export class ActualizarItemDto {
    @IsNotEmpty()
    @IsObject()
    data: any;
}

