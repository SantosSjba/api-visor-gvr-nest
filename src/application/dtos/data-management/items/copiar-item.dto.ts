import { IsNotEmpty, IsString } from 'class-validator';

export class CopiarItemDto {
    @IsNotEmpty()
    @IsString()
    sourceItemId: string;

    @IsNotEmpty()
    @IsString()
    sourceVersionId: string;

    @IsNotEmpty()
    @IsString()
    targetFolderId: string;
}
