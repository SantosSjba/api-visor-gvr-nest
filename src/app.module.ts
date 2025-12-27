import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/modules/auth.module';
import { AccModule } from './presentation/modules/acc.module';
import { AccProjectsModule } from './presentation/modules/acc-projects.module';
import { UserModule } from './presentation/modules/user.module';
import { GeneralModule } from './presentation/modules/general.module';
import { EmpresaModule } from './presentation/modules/empresa.module';
import { TrabajadorModule } from './presentation/modules/trabajador.module';
import { ProyectoModule } from './presentation/modules/proyecto.module';
import { RolModule } from './presentation/modules/rol.module';
import { PermisoModule } from './presentation/modules/permiso.module';
import { MenuGestionModule } from './presentation/modules/menu-gestion.module';
import { DataManagementModule } from './presentation/modules/data-management.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    // Módulo de base de datos
    DatabaseModule,
    // Módulos de funcionalidad
    AuthModule,
    AccModule,
    AccProjectsModule,
    UserModule,
    GeneralModule,
    EmpresaModule,
    TrabajadorModule,
    ProyectoModule,
    RolModule,
    PermisoModule,
    MenuGestionModule,
    DataManagementModule,
  ],
})
export class AppModule { }


