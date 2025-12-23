import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsInt, IsIn } from 'class-validator';

export class RegisterDto {
    @IsString()
    @MaxLength(255)
    nombre: string;

    @IsEmail()
    @MaxLength(255)
    correo: string;

    @IsString()
    @MinLength(6)
    contrasena: string;

    @IsOptional()
    @IsInt()
    @IsIn([0, 1])
    estado?: number;

    @IsOptional()
    @IsInt()
    id?: number | null;
}
