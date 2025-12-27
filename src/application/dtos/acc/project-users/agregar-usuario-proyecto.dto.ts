import { IsNotEmpty, IsEmail, IsOptional, IsString, IsArray, IsIn, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductDto {
    @IsNotEmpty()
    @IsString()
    key: string;

    @IsNotEmpty()
    @IsString()
    @IsIn(['administrator', 'user'])
    access: string;
}

export class AgregarUsuarioProyectoDto {
    @IsNotEmpty({ message: 'El email es requerido' })
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
    @Type(() => ProductDto)
    products?: ProductDto[];

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;

    @IsOptional()
    @IsString()
    user_id?: string;
}

