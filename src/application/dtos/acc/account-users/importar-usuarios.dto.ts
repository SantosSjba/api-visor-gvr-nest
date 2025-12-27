import { IsNotEmpty, IsArray, IsEmail, IsString, IsOptional, IsIn, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UsuarioImportDto {
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsOptional()
    @IsString()
    company_id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    first_name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    last_name?: string;
}

export class ImportarUsuariosDto {
    @IsNotEmpty({ message: 'Los usuarios son requeridos' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UsuarioImportDto)
    users: UsuarioImportDto[];

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}

