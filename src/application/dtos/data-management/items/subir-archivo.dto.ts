import { IsNotEmpty, IsString } from 'class-validator';

export class SubirArchivoDto {
    @IsNotEmpty()
    @IsString()
    folderId: string;
}

