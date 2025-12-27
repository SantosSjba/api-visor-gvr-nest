import { IsNotEmpty, IsArray, IsEmail, IsString, IsOptional, IsIn, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductImportDto {
    @IsNotEmpty()
    @IsString()
    key: string;

    @IsNotEmpty()
    @IsString()
    @IsIn(['administrator', 'user'])
    access: string;
}

class UsuarioProyectoImportDto {
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsOptional()
    @IsString()
    companyId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    roleIds?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImportDto)
    products?: ProductImportDto[];
}

export class ImportarUsuariosProyectoDto {
    @IsNotEmpty({ message: 'Los usuarios son requeridos' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UsuarioProyectoImportDto)
    users: UsuarioProyectoImportDto[];

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;

    @IsOptional()
    @IsString()
    user_id?: string;
}

