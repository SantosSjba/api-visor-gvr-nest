export class DataManagementItem {
    id: string;
    type: string;
    attributes?: {
        displayName?: string;
        createTime?: string;
        createUserId?: string;
        createUserName?: string;
        lastModifiedTime?: string;
        lastModifiedUserId?: string;
        lastModifiedUserName?: string;
        hidden?: boolean;
        reserved?: boolean;
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
