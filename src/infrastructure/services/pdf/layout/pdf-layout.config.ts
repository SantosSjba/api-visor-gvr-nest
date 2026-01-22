/**
 * Configuración base de layout para PDFs
 * Define márgenes, dimensiones útiles y sistema de grid
 */
export class PdfLayoutConfig {
    // Dimensiones de página A4
    static readonly PAGE_WIDTH = 595.28; // A4 width in points
    static readonly PAGE_HEIGHT = 841.89; // A4 height in points

    // Márgenes fijos
    static readonly MARGIN_TOP = 70;
    static readonly MARGIN_BOTTOM = 50;
    static readonly MARGIN_LEFT = 50;
    static readonly MARGIN_RIGHT = 50;

    // Área útil (content area)
    static get USABLE_WIDTH(): number {
        return this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT;
    }

    static get USABLE_HEIGHT(): number {
        return this.PAGE_HEIGHT - this.MARGIN_TOP - this.MARGIN_BOTTOM;
    }

    // Sistema de grid (12 columnas)
    static readonly GRID_COLUMNS = 12;
    static readonly GRID_GUTTER = 10;

    static get COLUMN_WIDTH(): number {
        return (this.USABLE_WIDTH - (this.GRID_GUTTER * (this.GRID_COLUMNS - 1))) / this.GRID_COLUMNS;
    }

    /**
     * Calcula el ancho de N columnas incluyendo gutters
     */
    static getColumnWidth(columns: number): number {
        if (columns < 1 || columns > this.GRID_COLUMNS) {
            throw new Error(`Columns must be between 1 and ${this.GRID_COLUMNS}`);
        }
        return columns * this.COLUMN_WIDTH + (columns - 1) * this.GRID_GUTTER;
    }

    /**
     * Calcula la posición X para una columna específica
     */
    static getColumnX(column: number): number {
        if (column < 1 || column > this.GRID_COLUMNS) {
            throw new Error(`Column must be between 1 and ${this.GRID_COLUMNS}`);
        }
        return this.MARGIN_LEFT + (column - 1) * (this.COLUMN_WIDTH + this.GRID_GUTTER);
    }

    // Espaciado vertical estándar
    static readonly SPACING_XS = 5;
    static readonly SPACING_SM = 10;
    static readonly SPACING_MD = 20;
    static readonly SPACING_LG = 30;
    static readonly SPACING_XL = 40;

    // Altura mínima para evitar cortes de página
    static readonly MIN_SPACE_BEFORE_PAGE_BREAK = 100;
}
