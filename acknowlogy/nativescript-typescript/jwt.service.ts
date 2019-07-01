import { Injectable } from "@angular/core";

import * as appSettings from "tns-core-modules/application-settings/application-settings";
import * as utils from "tns-core-modules/utils/utils";

const ACCESS_TOKEN_KEY = "AccessToken";
const REFRESH_TOKEN_KEY = "RefreshToken";

@Injectable()
export class JwtService {
    public getAccessToken(): string {
        return appSettings.getString(ACCESS_TOKEN_KEY);
    }

    public saveAccessToken(token: string) {
        appSettings.setString(ACCESS_TOKEN_KEY, utils.convertString(token));
    }

    public getRefreshToken(): string {
        return appSettings.getString(REFRESH_TOKEN_KEY);
    }

    public saveRefreshToken(token: string) {
        appSettings.setString(REFRESH_TOKEN_KEY, utils.convertString(token));
    }

    public destroyTokens() {
        appSettings.remove(ACCESS_TOKEN_KEY);
        appSettings.remove(REFRESH_TOKEN_KEY);
    }
}
