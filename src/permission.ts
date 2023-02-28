import { APIPermission, Config } from "./types";


export class Permissions {
    admin: PrivilegePermissions;
    user: UserPermissions;

    constructor(config: Config) {
        this.admin = new PrivilegePermissions(config);
        this.user = new UserPermissions(config);
    }
}

class BasePermissions {
    protected permissions: string[] 
    constructor() {
        this.permissions = [];
    }

    protected flatten(apiPermissions: Config['permissions']): APIPermission[] {
        return apiPermissions.flatMap((permission) => [permission.id, ...(permission.children || [])]);
    }

    protected append(permission: string) {
        this.permissions = [...this.permissions, permission];
    }

    allow(...permissions: string[]): string[] {
        const denied = [];
        for (const permission of permissions) {
            if (!this.permissions.includes(permission)) {
                denied.push(permission);
            }
        }
        return denied;
    }
}

class UserPermissions extends BasePermissions {
    
    constructor(config: Config) {
        super();

        const userPermissions = this.flatten(config.permissions);
        userPermissions.forEach((permission) => this.append(permission));
    }
}

class PrivilegePermissions extends UserPermissions {
    constructor(config: Config) {
        super(config);
        
        this.append('issue:api_token');
    }
}