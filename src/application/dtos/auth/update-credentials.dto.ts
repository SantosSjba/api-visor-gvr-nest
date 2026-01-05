import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateCredentialsDto {
    @IsOptional()
    @IsEmail()
    nuevoCorreo?: string;

    @IsOptional()
    @ValidateIf((o) => o.nuevaContrasena !== undefined && o.nuevaContrasena !== null && o.nuevaContrasena !== '')
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    nuevaContrasena?: string;
}
