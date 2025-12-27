import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class ActualizarImagenProyectoBim360Dto {
    @IsNotEmpty({ message: 'Los datos de la imagen son requeridos' })
    @IsString()
    image: string;

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}

