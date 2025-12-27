import { IsNotEmpty, IsArray, IsString, IsOptional, IsIn, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BusinessUnitDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsString()
    parent_id?: string;

    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}

export class CrearOActualizarBusinessUnitsDto {
    @IsNotEmpty({ message: 'Las business units son requeridas' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BusinessUnitDto)
    business_units: BusinessUnitDto[];

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}


