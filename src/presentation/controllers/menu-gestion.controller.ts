import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
    UnauthorizedException,
    ParseIntPipe,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import type { Request } from 'express';
import { ListarMenusUseCase } from '../../application/use-cases/menu-gestion/listar-menus.use-case';
import { ListarMenusTreeUseCase } from '../../application/use-cases/menu-gestion/listar-menus-tree.use-case';
import { ObtenerMenuUseCase } from '../../application/use-cases/menu-gestion/obtener-menu.use-case';
import { CrearMenuUseCase } from '../../application/use-cases/menu-gestion/crear-menu.use-case';
import { EditarMenuUseCase } from '../../application/use-cases/menu-gestion/editar-menu.use-case';
import { EliminarMenuUseCase } from '../../application/use-cases/menu-gestion/eliminar-menu.use-case';
import { ListarRolesMenuUseCase } from '../../application/use-cases/menu-gestion/listar-roles-menu.use-case';
import { ListarRolesDisponiblesMenuUseCase } from '../../application/use-cases/menu-gestion/listar-roles-disponibles-menu.use-case';
import { AsignarRolMenuUseCase } from '../../application/use-cases/menu-gestion/asignar-rol-menu.use-case';
import { AsignarRolesMenuUseCase } from '../../application/use-cases/menu-gestion/asignar-roles-menu.use-case';
import { RemoverRolMenuUseCase } from '../../application/use-cases/menu-gestion/remover-rol-menu.use-case';
import { SincronizarRolesMenuUseCase } from '../../application/use-cases/menu-gestion/sincronizar-roles-menu.use-case';
import { ObtenerDetalleMenuUseCase } from '../../application/use-cases/menu-gestion/obtener-detalle-menu.use-case';
import { ListarMenuPadresDisponiblesUseCase } from '../../application/use-cases/menu-gestion/listar-menu-padres-disponibles.use-case';
import { ClonarMenuUseCase } from '../../application/use-cases/menu-gestion/clonar-menu.use-case';
import { MoverMenuUseCase } from '../../application/use-cases/menu-gestion/mover-menu.use-case';
import { ReordenarMenuUseCase } from '../../application/use-cases/menu-gestion/reordenar-menu.use-case';
import { CreateMenuDto } from '../../application/dtos/menu-gestion/create-menu.dto';
import { UpdateMenuDto } from '../../application/dtos/menu-gestion/update-menu.dto';
import { AsignarRolMenuDto } from '../../application/dtos/menu-gestion/asignar-rol-menu.dto';
import { AsignarRolesMenuDto } from '../../application/dtos/menu-gestion/asignar-roles-menu.dto';
import { ClonarMenuDto } from '../../application/dtos/menu-gestion/clonar-menu.dto';
import { MoverMenuDto } from '../../application/dtos/menu-gestion/mover-menu.dto';
import { ReordenarMenuDto } from '../../application/dtos/menu-gestion/reordenar-menu.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('menus')
@UseGuards(JwtAuthGuard)
export class MenuGestionController {
    constructor(
        private readonly listarMenusUseCase: ListarMenusUseCase,
        private readonly listarMenusTreeUseCase: ListarMenusTreeUseCase,
        private readonly obtenerMenuUseCase: ObtenerMenuUseCase,
        private readonly crearMenuUseCase: CrearMenuUseCase,
        private readonly editarMenuUseCase: EditarMenuUseCase,
        private readonly eliminarMenuUseCase: EliminarMenuUseCase,
        private readonly listarRolesMenuUseCase: ListarRolesMenuUseCase,
        private readonly listarRolesDisponiblesMenuUseCase: ListarRolesDisponiblesMenuUseCase,
        private readonly asignarRolMenuUseCase: AsignarRolMenuUseCase,
        private readonly asignarRolesMenuUseCase: AsignarRolesMenuUseCase,
        private readonly removerRolMenuUseCase: RemoverRolMenuUseCase,
        private readonly sincronizarRolesMenuUseCase: SincronizarRolesMenuUseCase,
        private readonly obtenerDetalleMenuUseCase: ObtenerDetalleMenuUseCase,
        private readonly listarMenuPadresDisponiblesUseCase: ListarMenuPadresDisponiblesUseCase,
        private readonly clonarMenuUseCase: ClonarMenuUseCase,
        private readonly moverMenuUseCase: MoverMenuUseCase,
        private readonly reordenarMenuUseCase: ReordenarMenuUseCase,
        private readonly jwtService: JwtService,
    ) { }

    @Get('tree')
    @HttpCode(HttpStatus.OK)
    async listarMenusTree() {
        const data = await this.listarMenusTreeUseCase.execute();
        return ApiResponseDto.success(data, 'Menús en árbol obtenidos exitosamente');
    }

    @Get('padres-disponibles')
    @HttpCode(HttpStatus.OK)
    async listarMenuPadresDisponibles(@Query('idMenuActual', new ParseIntPipe({ optional: true })) idMenuActual?: number) {
        const data = await this.listarMenuPadresDisponiblesUseCase.execute(idMenuActual);
        return ApiResponseDto.success(data, 'Padres disponibles obtenidos exitosamente');
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async listarMenus(
        @Query('busqueda') busqueda?: string,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    ) {
        const data = await this.listarMenusUseCase.execute({ busqueda, limit, offset });
        return ApiResponseDto.success(data, 'Menús obtenidos exitosamente');
    }

    @Get(':id/detalle')
    @HttpCode(HttpStatus.OK)
    async obtenerDetalleMenu(@Param('id', ParseIntPipe) id: number) {
        const data = await this.obtenerDetalleMenuUseCase.execute(id);
        return ApiResponseDto.success(data, 'Detalle del menú obtenido exitosamente');
    }

    @Get(':id/roles')
    @HttpCode(HttpStatus.OK)
    async listarRolesMenu(@Param('id', ParseIntPipe) id: number) {
        const data = await this.listarRolesMenuUseCase.execute(id);
        return ApiResponseDto.success(data, 'Roles del menú obtenidos exitosamente');
    }

    @Get(':id/roles-disponibles')
    @HttpCode(HttpStatus.OK)
    async listarRolesDisponibles(@Param('id', ParseIntPipe) id: number) {
        const data = await this.listarRolesDisponiblesMenuUseCase.execute(id);
        return ApiResponseDto.success(data, 'Roles disponibles obtenidos exitosamente');
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async obtenerMenu(@Param('id', ParseIntPipe) id: number) {
        const data = await this.obtenerMenuUseCase.execute(id);
        return ApiResponseDto.success(data, 'Menú obtenido exitosamente');
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearMenu(@Body() createDto: CreateMenuDto, @Req() request: Request) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.crearMenuUseCase.execute(createDto, payload.sub);

        return ApiResponseDto.created(data, 'Menú creado exitosamente');
    }

    @Post(':id/clonar')
    @HttpCode(HttpStatus.CREATED)
    async clonarMenu(
        @Param('id', ParseIntPipe) id: number,
        @Body() cloneDto: ClonarMenuDto,
        @Req() request: Request
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.clonarMenuUseCase.execute(id, cloneDto, payload.sub);

        return ApiResponseDto.created(data, 'Menú clonado exitosamente');
    }

    @Post(':id/roles')
    @HttpCode(HttpStatus.CREATED)
    async asignarRolMenu(
        @Param('id', ParseIntPipe) id: number,
        @Body() asignarDto: AsignarRolMenuDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.asignarRolMenuUseCase.execute(id, asignarDto, payload.sub);

        return ApiResponseDto.created(data, 'Rol asignado exitosamente');
    }

    @Post(':id/roles-multiples')
    @HttpCode(HttpStatus.CREATED)
    async asignarRolesMenu(
        @Param('id', ParseIntPipe) id: number,
        @Body() asignarDto: AsignarRolesMenuDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.asignarRolesMenuUseCase.execute(id, asignarDto, payload.sub);

        return ApiResponseDto.created(data, 'Roles asignados exitosamente');
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async editarMenu(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMenuDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.editarMenuUseCase.execute(id, updateDto, payload.sub);

        return ApiResponseDto.success(data, 'Menú actualizado exitosamente');
    }

    @Put(':id/mover')
    @HttpCode(HttpStatus.OK)
    async moverMenu(
        @Param('id', ParseIntPipe) id: number,
        @Body() moverDto: MoverMenuDto,
        @Req() request: Request
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.moverMenuUseCase.execute(id, moverDto, payload.sub);

        return ApiResponseDto.success(data, 'Menú movido exitosamente');
    }

    @Put(':id/reordenar')
    @HttpCode(HttpStatus.OK)
    async reordenarMenu(
        @Param('id', ParseIntPipe) id: number,
        @Body() reordenarDto: ReordenarMenuDto,
        @Req() request: Request
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.reordenarMenuUseCase.execute(id, reordenarDto, payload.sub);

        return ApiResponseDto.success(data, 'Menú reordenado exitosamente');
    }

    @Put(':id/roles/sincronizar')
    @HttpCode(HttpStatus.OK)
    async sincronizarRolesMenu(
        @Param('id', ParseIntPipe) id: number,
        @Body() sincronizarDto: AsignarRolesMenuDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.sincronizarRolesMenuUseCase.execute(id, sincronizarDto, payload.sub);

        return ApiResponseDto.success(data, 'Roles sincronizados exitosamente');
    }

    @Delete(':id/roles/:idRol')
    @HttpCode(HttpStatus.OK)
    async removerRolMenu(
        @Param('id', ParseIntPipe) id: number,
        @Param('idRol', ParseIntPipe) idRol: number,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.removerRolMenuUseCase.execute(id, idRol, payload.sub);

        return ApiResponseDto.success(data, 'Rol removido exitosamente');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async eliminarMenu(@Param('id', ParseIntPipe) id: number, @Req() request: Request) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.eliminarMenuUseCase.execute(id, payload.sub);

        return ApiResponseDto.success(data, 'Menú eliminado exitosamente');
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) return undefined;

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
