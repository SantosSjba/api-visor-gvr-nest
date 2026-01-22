/**
 * Helpers para procesamiento de texto en PDFs
 */
export class PdfTextHelper {
    /**
     * Procesa el texto de un comentario eliminando marcadores de firma GVR
     * y normalizando espacios
     */
    static procesarTextoComentario(texto: string): string {
        // Eliminar marcadores de firma GVR
        texto = texto.replace(/---?FIRMA_GVR---?/gi, '');
        texto = texto.replace(/<---?FIRMA_GVR---?>/gi, '');
        texto = texto.replace(/---?FIN_FIRMA_GVR---?/gi, '');
        texto = texto.replace(/<---?FIN_FIRMA_GVR---?>/gi, '');
        // Limpiar espacios múltiples
        texto = texto.replace(/\s+/g, ' ').trim();
        return texto;
    }
}
