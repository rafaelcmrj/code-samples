import {
    HttpClient,
    HttpErrorResponse,
    HttpParams
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { messageType } from "tns-core-modules/trace/trace";

import * as logger from "~/core/logger";
import { environment } from "~/environments/environment";

import { JwtService } from "./jwt.service";

@Injectable()
export class ApiService {
    private _http: HttpClient;
    private _jwtService: JwtService;

    constructor(http: HttpClient, jwtService: JwtService) {
        this._http = http;
        this._jwtService = jwtService;
    }

    public get<T>(
        path: string,
        params: HttpParams = new HttpParams()
    ): Observable<T> {
        logger.write(
            `get '${path}' with params ${JSON.stringify(
                (<any>params).updates
            )}`,
            "API",
            messageType.log
        );
        return this._http.get(`${environment.api_url}${path}`, { params }).pipe(
            catchError(this._handleError),
            map(result => {
                logger.write(
                    `get '${path}' returned ${JSON.stringify(result)}`,
                    "API",
                    messageType.log
                );

                return result;
            })
        ) as Observable<T>;
    }

    public put<T>(path: string, body: object = {}): Observable<T> {
        logger.write(
            `put '${path}' with params ${JSON.stringify(body)}`,
            "API",
            messageType.log
        );
        return this._http
            .put(`${environment.api_url}${path}`, JSON.stringify(body))
            .pipe(
                catchError(this._handleError),
                map(result => {
                    logger.write(
                        `put '${path}' returned ${JSON.stringify(result)}`,
                        "API",
                        messageType.log
                    );

                    return result;
                })
            ) as Observable<T>;
    }

    public post<T>(path: string, body: object = {}): Observable<T> {
        logger.write(
            `post '${path}' with params ${JSON.stringify(body)}`,
            "API",
            messageType.log
        );
        return this._http
            .post(`${environment.api_url}${path}`, JSON.stringify(body))
            .pipe(
                catchError(this._handleError),
                map(result => {
                    logger.write(
                        `post '${path}' returned ${JSON.stringify(result)}`,
                        "API",
                        messageType.log
                    );

                    return result;
                })
            ) as Observable<T>;
    }

    public delete<T>(path): Observable<T> {
        logger.write(`ApiService: delete '${path}'`, "API", messageType.log);
        return this._http.delete(`${environment.api_url}${path}`).pipe(
            catchError(this._handleError),
            map(result => {
                logger.write(
                    `ApiService: delete '${path}' returned ${JSON.stringify(
                        result
                    )}`,
                    "API",
                    messageType.log
                );

                return result;
            })
        ) as Observable<T>;
    }

    private _handleError(response: HttpErrorResponse) {
        console.log("ApiService: handleError: " + JSON.stringify(response));
        return throwError(response.error);
    }
}
