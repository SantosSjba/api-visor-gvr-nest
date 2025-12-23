import { IsString, IsDateString } from 'class-validator';

export class ValidarExpiracionDto {
    @IsString()
    @IsDateString()
    expires_at: string;
}
