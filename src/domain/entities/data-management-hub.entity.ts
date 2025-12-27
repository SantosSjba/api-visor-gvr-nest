export class DataManagementHub {
    id: string;
    type: string;
    attributes?: {
        name?: string;
        region?: string;
        extension?: {
            type?: string;
            version?: string;
            schema?: {
                href?: string;
            };
            data?: any;
        };
    };
    relationships?: any;
    links?: {
        self?: {
            href?: string;
        };
    };
}
