import { IsString, IsOptional } from 'class-validator';

export class CallbackAutorizacionDto {
    @IsString()
    code: string;

    @IsString()
    state: string;

    @IsOptional()
    @IsString()
    error?: string;

    @IsOptional()
    @IsString()
    error_description?: string;
}
