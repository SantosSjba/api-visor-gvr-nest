import { IsNotEmpty, IsObject } from 'class-validator';

export class CrearReferenciaItemDto {
    @IsNotEmpty()
    @IsObject()
    data: any;
}

