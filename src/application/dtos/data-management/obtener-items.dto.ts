import { IsOptional, IsString } from 'class-validator';

export class ObtenerItemsDto {
    @IsOptional()
    @IsString()
    folder_id?: string;
}
