export interface AccTokenData {
    id?: number;
    idUsuario?: number;
    tokenAcceso: string;
    tokenRefresco?: string;
    expiraEn: Date;
    tipoToken: string;
    fechaCreacion?: Date;
    fechaModificacion?: Date;
}

export class AccToken {
    id?: number;
    idUsuario?: number;
    tokenAcceso: string;
    tokenRefresco?: string;
    expiraEn: Date;
    tipoToken: string;
    fechaCreacion?: Date;
    fechaModificacion?: Date;

    constructor(data: AccTokenData) {
        this.id = data.id;
        this.idUsuario = data.idUsuario;
        this.tokenAcceso = data.tokenAcceso;
        this.tokenRefresco = data.tokenRefresco;
        this.expiraEn = data.expiraEn;
        this.tipoToken = data.tipoToken;
        this.fechaCreacion = data.fechaCreacion;
        this.fechaModificacion = data.fechaModificacion;
    }

    isExpired(): boolean {
        const now = new Date();
        const expirationDate = new Date(this.expiraEn);
        // Consider expired if less than 5 minutes remaining
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        return expirationDate.getTime() - now.getTime() < bufferTime;
    }
}
