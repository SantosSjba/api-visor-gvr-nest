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
import { DataManagementFoldersModule } from './presentation/modules/data-management-folders.module';
import { DataManagementProjectsModule } from './presentation/modules/data-management-projects.module';
import { DataManagementItemsModule } from './presentation/modules/data-management-items.module';
import { DataManagementVersionsModule } from './presentation/modules/data-management-versions.module';
import { AccViewerModule } from './presentation/modules/acc-viewer.module';
import { AccIssuesModule } from './presentation/modules/acc-issues.module';
import { IssuesBim360Module } from './presentation/modules/issues-bim360.module';
import { AccResourcesModule } from './presentation/modules/acc-resources.module';
import { CompaniesModule } from './presentation/modules/companies.module';
import { AccAccountUsersModule } from './presentation/modules/acc-account-users.module';
import { AccProjectUsersModule } from './presentation/modules/acc-project-users.module';
import { BusinessUnitsModule } from './presentation/modules/business-units.module';

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
    AccIssuesModule,
    IssuesBim360Module,
    AccResourcesModule,
    CompaniesModule,
    AccAccountUsersModule,
    AccProjectUsersModule,
    BusinessUnitsModule,
    UserModule,
    GeneralModule,
    EmpresaModule,
    TrabajadorModule,
    ProyectoModule,
    RolModule,
    PermisoModule,
    MenuGestionModule,
    DataManagementModule,
    DataManagementFoldersModule,
    DataManagementProjectsModule,
    DataManagementItemsModule,
    DataManagementVersionsModule,
    AccViewerModule,
  ],
})
export class AppModule { }


