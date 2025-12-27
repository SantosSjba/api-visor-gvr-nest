import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActualizarUsuarioDto } from '../../../dtos/acc/account-users/actualizar-usuario.dto';

@Injectable()
export class ActualizarUsuarioUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, userId: string, dto: ActualizarUsuarioDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const userData: Record<string, any> = {};
        if (dto.company_id !== undefined) userData.company_id = dto.company_id;
        if (dto.nickname !== undefined) userData.nickname = dto.nickname;
        if (dto.first_name !== undefined) userData.first_name = dto.first_name;
        if (dto.last_name !== undefined) userData.last_name = dto.last_name;
        if (dto.image_url !== undefined) userData.image_url = dto.image_url;
        if (dto.address_line_1 !== undefined) userData.address_line_1 = dto.address_line_1;
        if (dto.address_line_2 !== undefined) userData.address_line_2 = dto.address_line_2;
        if (dto.city !== undefined) userData.city = dto.city;
        if (dto.state_or_province !== undefined) userData.state_or_province = dto.state_or_province;
        if (dto.postal_code !== undefined) userData.postal_code = dto.postal_code;
        if (dto.country !== undefined) userData.country = dto.country;
        if (dto.phone !== undefined) userData.phone = dto.phone;
        if (dto.company !== undefined) userData.company = dto.company;
        if (dto.job_title !== undefined) userData.job_title = dto.job_title;
        if (dto.industry !== undefined) userData.industry = dto.industry;
        if (dto.about_me !== undefined) userData.about_me = dto.about_me;
        if (dto.default_role !== undefined) userData.default_role = dto.default_role;

        if (Object.keys(userData).length === 0) {
            throw new BadRequestException('Debe proporcionar al menos un campo para actualizar');
        }

        return await this.autodeskApiService.actualizarUsuario(token.access_token, accountId, userId, userData, dto.region);
    }
}


