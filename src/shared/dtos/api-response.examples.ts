/**
 * EJEMPLOS DE USO - ApiResponseDto
 * 
 * Este archivo muestra cómo usar todos los métodos helper disponibles
 * en ApiResponseDto para mantener respuestas consistentes en toda la API.
 */

import { ApiResponseDto } from './api-response.dto';

// ============================================
// RESPUESTAS EXITOSAS (2xx)
// ============================================

// 200 - Success (GET, general)
const successExample = ApiResponseDto.success(
    { id: 1, nombre: 'Usuario' },
    'Usuario obtenido exitosamente'
);
// Resultado:
// {
//   "data": { "id": 1, "nombre": "Usuario" },
//   "message": "Usuario obtenido exitosamente",
//   "status": 200
// }

// 201 - Created (POST)
const createdExample = ApiResponseDto.created(
    { id: 1, nombre: 'Nuevo Usuario' },
    'Usuario creado exitosamente'
);

// 200 - Updated (PUT/PATCH)
const updatedExample = ApiResponseDto.updated(
    { id: 1, nombre: 'Usuario Actualizado' },
    'Usuario actualizado exitosamente'
);

// 200 - Deleted (DELETE con respuesta)
const deletedExample = ApiResponseDto.deleted(
    { id: 1 },
    'Usuario eliminado exitosamente'
);

// 204 - No Content (DELETE sin respuesta)
const noContentExample = ApiResponseDto.noContent(
    'Usuario eliminado exitosamente'
);

// ============================================
// RESPUESTAS PAGINADAS
// ============================================

const paginatedExample = ApiResponseDto.paginated(
    [
        { id: 1, nombre: 'Usuario 1' },
        { id: 2, nombre: 'Usuario 2' },
    ],
    {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 50,
        totalPages: 5,
    },
    'Usuarios obtenidos exitosamente'
);
// Resultado:
// {
//   "data": [...],
//   "message": "Usuarios obtenidos exitosamente",
//   "status": 200,
//   "pagination": {
//     "currentPage": 1,
//     "itemsPerPage": 10,
//     "totalItems": 50,
//     "totalPages": 5
//   }
// }

// ============================================
// RESPUESTAS DE ERROR (4xx)
// ============================================

// 400 - Bad Request
const badRequestExample = ApiResponseDto.badRequest(
    'Los datos proporcionados son inválidos'
);

// 401 - Unauthorized
const unauthorizedExample = ApiResponseDto.unauthorized(
    'Credenciales inválidas'
);

// 403 - Forbidden
const forbiddenExample = ApiResponseDto.forbidden(
    'No tienes permisos para acceder a este recurso'
);

// 404 - Not Found
const notFoundExample = ApiResponseDto.notFound(
    'Usuario no encontrado'
);

// 409 - Conflict
const conflictExample = ApiResponseDto.conflict(
    'El correo ya está registrado'
);

// ============================================
// RESPUESTAS DE ERROR DEL SERVIDOR (5xx)
// ============================================

// 500 - Internal Server Error
const errorExample = ApiResponseDto.error(
    'Error al procesar la solicitud'
);

// Error personalizado con código específico
const customErrorExample = ApiResponseDto.error(
    'Servicio temporalmente no disponible',
    503
);

// ============================================
// RESPUESTA PERSONALIZADA
// ============================================

const customExample = ApiResponseDto.custom(
    { procesado: true },
    'Operación procesada',
    202, // Accepted
);

// ============================================
// EJEMPLO EN UN CONTROLLER
// ============================================

/*
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { PaginationDto } from '../../shared/dtos/pagination.dto';

@Controller('users')
export class UsersController {

    // GET /users - Lista paginada
    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        const users = await this.usersService.findAll(paginationDto);
        const total = await this.usersService.count();

        return ApiResponseDto.paginated(
            users,
            {
                currentPage: paginationDto.page,
                itemsPerPage: paginationDto.limit,
                totalItems: total,
                totalPages: Math.ceil(total / paginationDto.limit),
            },
            'Usuarios obtenidos exitosamente'
        );
    }

    // GET /users/:id - Obtener uno
    @Get(':id')
    async findOne(@Param('id') id: number) {
        const user = await this.usersService.findOne(id);

        if (!user) {
            return ApiResponseDto.notFound('Usuario no encontrado');
        }

        return ApiResponseDto.success(user, 'Usuario obtenido exitosamente');
    }

    // POST /users - Crear
    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return ApiResponseDto.created(user, 'Usuario creado exitosamente');
    }

    // PUT /users/:id - Actualizar
    @Put(':id')
    async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
        const user = await this.usersService.update(id, updateUserDto);
        return ApiResponseDto.updated(user, 'Usuario actualizado exitosamente');
    }

    // DELETE /users/:id - Eliminar
    @Delete(':id')
    async remove(@Param('id') id: number) {
        await this.usersService.remove(id);
        return ApiResponseDto.deleted(null, 'Usuario eliminado exitosamente');
    }
}
*/

// ============================================
// EJEMPLO EN UN USE CASE CON MANEJO DE ERRORES
// ============================================

/*
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

@Injectable()
export class CreateUserUseCase {
    async execute(createUserDto: CreateUserDto) {
        // Verificar si existe
        const existingUser = await this.userRepository.findByEmail(createUserDto.email);
        
        if (existingUser) {
            // El GlobalExceptionFilter convertirá esto automáticamente
            throw new ConflictException('El correo ya está registrado');
        }
        
        // Crear usuario
        const user = await this.userRepository.create(createUserDto);
        
        // El controller se encarga de envolver en ApiResponseDto
        return user;
    }
}
*/
