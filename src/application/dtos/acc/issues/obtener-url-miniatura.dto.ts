import { IsString } from 'class-validator';

export class ObtenerUrlMiniaturaDto {
    @IsString()
    snapshotUrn: string;
}


