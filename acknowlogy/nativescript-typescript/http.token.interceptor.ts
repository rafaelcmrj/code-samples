import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest
} from "@angular/common/http";
import { Injectable, Injector } from "@angular/core";
import { BehaviorSubject, empty, Observable, throwError } from "rxjs";
import { catchError, filter, finalize, switchMap, take } from "rxjs/operators";

import { JwtService, UserService } from "~/core/services";

@Injectable()
export class HttpTokenInterceptor implements HttpInterceptor {
    private readonly _jwtService: JwtService;
    private readonly _injector: Injector;
    private _isRefreshingToken: boolean;
    private _tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<
        string | null
    >(null);
    constructor(jwtService: JwtService, injector: Injector) {
        this._jwtService = jwtService;
        this._injector = injector;
        this._isRefreshingToken = false;
    }

    public intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return next.handle(this.addToken(req)).pipe(
            catchError(error => {
                // Don't handle errors if we're attempting a refresh
                if (
                    !this._isRefreshingToken &&
                    error instanceof HttpErrorResponse
                ) {
                    console.log(
                        "HttpTokenInterceptor: caught error code " +
                        (<HttpErrorResponse>error).status
                    );
                    switch ((<HttpErrorResponse>error).status) {
                        case 400:
                            return this.handle400Error(error);
                        case 401:
                            return this.handle401Error(req, next);
                    }
                }

                return throwError(error);
            })
        );
    }

    public addToken(req: HttpRequest<any>): HttpRequest<any> {
        console.log(
            "HttpTokenInterceptor: Using " +
            (this._isRefreshingToken ? "refresh" : "auth") +
            " token"
        );
        const headersConfig = {
            "Content-Type": "application/json",
            Accept: "application/json"
        };

        const token = this._isRefreshingToken
            ? this._jwtService.getRefreshToken()
            : this._jwtService.getAccessToken();

        if (token) {
            headersConfig["Authorization"] = `Bearer ${token}`;
        }

        return req.clone({ setHeaders: headersConfig });
    }

    public handle400Error(error) {
        console.log("HttpTokenInterceptor: handling 400 error");
        console.log(error);
        if (
            error &&
            error.status === 400 &&
            error.error &&
            error.error.error === "invalid_grant"
        ) {
            // If we get a 400 and the error message is 'invalid_grant', the token is no longer valid so logout.
            this._injector.get(UserService).purgeAuth();

            return empty();
        }

        return throwError(error);
    }

    public handle401Error(req: HttpRequest<any>, next: HttpHandler) {
        console.log("HttpTokenInterceptor: handling 401 error");
        if (!this._isRefreshingToken) {
            this._isRefreshingToken = true;
            console.log(
                "HttpTokenInterceptor: Attempting to refresh access token"
            );

            // Reset here so that the following requests wait until the token
            // comes back from the refreshToken call.
            this._tokenSubject.next(null);
            const userService = this._injector.get(UserService);

            return userService.attemptRefresh().pipe(
                switchMap((newToken: string) => {
                    console.log("HttpTokenInterceptor: refresh returned");
                    console.log(newToken);
                    if (newToken) {
                        this._tokenSubject.next(newToken);
                        return next.handle(this.addToken(req));
                    }

                    // If we don't get a new token, we are in trouble so logout.
                    userService.purgeAuth();

                    return empty();
                }),
                catchError(error => {
                    console.log("HttpTokenInterceptor: error during refresh");
                    console.log(error);

                    // If there is an exception calling 'refreshToken', bad news so logout.
                    userService.purgeAuth();

                    return empty();
                }),
                finalize(() => {
                    console.log("HttpTokenInterceptor: done refreshing");
                    this._isRefreshingToken = false;
                    if (this._jwtService.getAccessToken()) {
                        console.log(
                            "HttpTokenInterceptor: repopulating user data"
                        );
                        userService.populate();
                    }
                })
            );
        } else {
            return this._tokenSubject.pipe(
                filter(token => token != null),
                take(1),
                switchMap(token => {
                    return next.handle(this.addToken(req));
                })
            );
        }
    }
}
