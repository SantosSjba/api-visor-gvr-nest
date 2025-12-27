import { IsNotEmpty, IsString, IsOptional, IsIn, Matches, MinLength, MaxLength } from 'class-validator';

export class CrearBucketDto {
    @IsNotEmpty({ message: 'El bucket key es requerido' })
    @IsString()
    @MinLength(3)
    @MaxLength(128)
    @Matches(/^[-_.a-z0-9]+$/, {
        message: 'El bucket key debe contener solo letras minúsculas, números, guiones y puntos',
    })
    bucketKey: string;

    @IsOptional()
    @IsString()
    @IsIn(['transient', 'temporary', 'persistent'])
    policyKey?: string;

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA', 'AP'])
    region?: string;
}

