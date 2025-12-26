import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IMenuRepository } from '../../../domain/repositories/menu.repository.interface';
import { MENU_REPOSITORY } from '../../../domain/repositories/menu.repository.interface';

@Injectable()
export class ListarMenuRecursivoUseCase {
    constructor(
        @Inject(MENU_REPOSITORY)
        private readonly menuRepository: IMenuRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(token: string): Promise<any> {
        // Validate and decode token to get user ID
        const payload = await this.jwtService.verifyAsync(token);

        if (!payload || !payload.sub) {
            throw new Error('Token inválido');
        }

        const menuOpciones = await this.menuRepository.listarMenuRecursivo(payload.sub);

        return menuOpciones || [];
    }
}
