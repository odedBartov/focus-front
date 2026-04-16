export class RelatedDocument {
    documentId!: number;
    documentNumber!: number;
    originalPrice?: number;
    VAT?: number;

    constructor() {
        this.documentId = 0;
        this.documentNumber = 0;
    }
}