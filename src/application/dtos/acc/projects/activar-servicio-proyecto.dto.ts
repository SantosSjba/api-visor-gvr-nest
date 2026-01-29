import { IsNotEmpty, IsString, IsOptional, IsEmail, IsIn } from 'class-validator';

export class ActivarServicioProyectoDto {
    @IsNotEmpty({ message: 'El email del usuario administrador de ACC es requerido' })
    @IsEmail({}, { message: 'El email debe tener un formato válido' })
    email: string;

    @IsNotEmpty({ message: 'El servicio a activar es requerido' })
    @IsString()
    @IsIn(['docs', 'projectAdministration', 'cost', 'buildingConnected', 'assets', 'insight', 'modelCoordination', 'schedule', 'quantification', 'designCollaboration'], {
        message: 'El servicio debe ser uno de los siguientes: docs, projectAdministration, cost, buildingConnected, assets, insight, modelCoordination, schedule, quantification, designCollaboration',
    })
    service: string;

    @IsOptional()
    @IsString()
    @IsIn(['administrator', 'user'])
    accessLevel?: string = 'administrator';

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}
