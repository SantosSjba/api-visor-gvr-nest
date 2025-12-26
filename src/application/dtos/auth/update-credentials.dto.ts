import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCredentialsDto {
    @IsOptional()
    @IsEmail()
    nuevoCorreo?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    nuevaContrasena?: string;
}
