import { IsOptional, IsString, IsObject } from 'class-validator';

export class ObtenerHubsDto {
    @IsOptional()
    @IsObject()
    filters?: {
        id?: string;
        name?: string;
        'extension.type'?: string;
    };
}
