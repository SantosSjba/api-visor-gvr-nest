import { IsNotEmpty, IsString } from 'class-validator';

export class DesplazarItemDto {
    @IsNotEmpty()
    @IsString()
    targetFolderId: string;
}
