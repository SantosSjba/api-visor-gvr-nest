export class DataManagementVersion {
    id: string;
    type: string;
    attributes?: {
        name?: string;
        displayName?: string;
        createTime?: string;
        createUserId?: string;
        createUserName?: string;
        lastModifiedTime?: string;
        lastModifiedUserId?: string;
        lastModifiedUserName?: string;
        versionNumber?: number;
        mimeType?: string;
        fileType?: string;
        storageSize?: number;
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
