/**
 * Normaliza un external_id de ACC eliminando el prefijo "b." si existe
 * 
 * ACC utiliza el prefijo "b." en sus IDs en algunos contextos, pero no en otros.
 * Esta función asegura consistencia eliminando siempre el prefijo para almacenamiento en BD.
 * 
 * @param externalId - El ID externo a normalizar (puede incluir o no el prefijo "b.")
 * @returns El ID normalizado sin el prefijo "b."
 * 
 * @example
 * normalizeExternalId('b.e161b38c-8e5f-49f7-854d-096a0ecef3c1')
 * // returns 'e161b38c-8e5f-49f7-854d-096a0ecef3c1'
 * 
 * normalizeExternalId('e161b38c-8e5f-49f7-854d-096a0ecef3c1')
 * // returns 'e161b38c-8e5f-49f7-854d-096a0ecef3c1'
 */
export function normalizeExternalId(externalId: string | null | undefined): string | null {
    if (!externalId) {
        return null;
    }
    
    // Si el ID comienza con "b.", quitarlo
    if (externalId.startsWith('b.')) {
        return externalId.substring(2);
    }
    
    return externalId;
}

/**
 * Agrega el prefijo "b." al external_id si no lo tiene
 * Útil para hacer llamadas a la API de ACC que requieren el prefijo
 * 
 * @param externalId - El ID externo
 * @returns El ID con el prefijo "b."
 * 
 * @example
 * addAccPrefix('e161b38c-8e5f-49f7-854d-096a0ecef3c1')
 * // returns 'b.e161b38c-8e5f-49f7-854d-096a0ecef3c1'
 * 
 * addAccPrefix('b.e161b38c-8e5f-49f7-854d-096a0ecef3c1')
 * // returns 'b.e161b38c-8e5f-49f7-854d-096a0ecef3c1'
 */
export function addAccPrefix(externalId: string | null | undefined): string | null {
    if (!externalId) {
        return null;
    }
    
    // Si ya tiene el prefijo, devolverlo tal cual
    if (externalId.startsWith('b.')) {
        return externalId;
    }
    
    // Agregar el prefijo
    return `b.${externalId}`;
}

