import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CrearSubcarpetaDto {
    @IsNotEmpty()
    @IsString()
    folderName: string;

    @IsOptional()
    @IsString()
    folderType?: string;
}
