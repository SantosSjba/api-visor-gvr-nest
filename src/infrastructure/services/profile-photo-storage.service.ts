import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const UPLOAD_DIR = 'uploads';
const PROFILES_DIR = 'profiles';

@Injectable()
export class ProfilePhotoStorageService {
    private readonly logger = new Logger(ProfilePhotoStorageService.name);
    private readonly baseDir: string;

    constructor() {
        this.baseDir = join(process.cwd(), UPLOAD_DIR, PROFILES_DIR);
    }

    async save(userId: number, file: Express.Multer.File): Promise<string> {
        if (!file?.buffer) {
            throw new BadRequestException('No se recibió ningún archivo');
        }

        const mime = file.mimetype?.toLowerCase() ?? '';
        if (!ALLOWED_MIMES.includes(mime)) {
            throw new BadRequestException(
                'Formato no permitido. Use JPEG, PNG o WebP.',
            );
        }

        const size = file.size ?? 0;
        if (size > MAX_SIZE_BYTES) {
            throw new BadRequestException(
                'La imagen no debe superar 2 MB.',
            );
        }

        const ext = this.getExtension(mime);
        const filename = `${userId}-${Date.now()}${ext}`;
        const relativePath = `${PROFILES_DIR}/${filename}`;
        const absolutePath = join(this.baseDir, filename);

        if (!existsSync(this.baseDir)) {
            await mkdir(this.baseDir, { recursive: true });
        }

        await writeFile(absolutePath, file.buffer);
        return relativePath;
    }

    /**
     * Elimina un archivo de foto de perfil dado su path relativo (ej: profiles/1-123.jpg)
     */
    async delete(relativePath: string): Promise<void> {
        if (!relativePath) return;
        try {
            const absolutePath = join(process.cwd(), UPLOAD_DIR, relativePath);
            if (existsSync(absolutePath)) {
                await unlink(absolutePath);
                this.logger.log(`Archivo eliminado: ${relativePath}`);
            }
        } catch (error) {
            this.logger.warn(`No se pudo eliminar archivo ${relativePath}: ${error}`);
        }
    }

    private getExtension(mime: string): string {
        const map: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
        };
        return map[mime] ?? '.jpg';
    }
}
