import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearUsuarioDto } from '../../../dtos/acc/account-users/crear-usuario.dto';

@Injectable()
export class CrearUsuarioUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: CrearUsuarioDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const userData: Record<string, any> = {
            email: dto.email,
        };

        if (dto.company_id) userData.company_id = dto.company_id;
        if (dto.nickname) userData.nickname = dto.nickname;
        if (dto.first_name) userData.first_name = dto.first_name;
        if (dto.last_name) userData.last_name = dto.last_name;
        if (dto.image_url) userData.image_url = dto.image_url;
        if (dto.address_line_1) userData.address_line_1 = dto.address_line_1;
        if (dto.address_line_2) userData.address_line_2 = dto.address_line_2;
        if (dto.city) userData.city = dto.city;
        if (dto.state_or_province) userData.state_or_province = dto.state_or_province;
        if (dto.postal_code) userData.postal_code = dto.postal_code;
        if (dto.country) userData.country = dto.country;
        if (dto.phone) userData.phone = dto.phone;
        if (dto.company) userData.company = dto.company;
        if (dto.job_title) userData.job_title = dto.job_title;
        if (dto.industry) userData.industry = dto.industry;
        if (dto.about_me) userData.about_me = dto.about_me;
        if (dto.default_role) userData.default_role = dto.default_role;

        return await this.autodeskApiService.crearUsuario(token.access_token, accountId, userData, dto.region);
    }
}


