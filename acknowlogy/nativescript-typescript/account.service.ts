import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import {
    DashboardData,
    MenuData,
    NotificationsList,
    NotificationsListParams,
    TasksList,
    TasksListParams
} from "~/core/models";
import { ApiService } from "./api.service";

@Injectable()
export class AccountService {
    constructor(private _apiService: ApiService) { }

    public getDashboardData(): Observable<DashboardData> {
        return this._apiService.get<DashboardData>(`/account/dashboard`);
    }

    public getMenuData(): Observable<MenuData> {
        return this._apiService.get<MenuData>(`/account/menu`);
    }

    public getNotifications(
        attributes: NotificationsListParams
    ): Observable<NotificationsList> {
        const httpParams = new HttpParams()
            .set("count", (attributes.count ? attributes.count.toString() : ""))
            .set("offset", (attributes.offset ? attributes.offset.toString() : ""));

        return this._apiService.get<NotificationsList>(
            `/account/notifications`,
            httpParams
        );
    }

    public getNotificationCount(): Observable<number> {
        return this._apiService.get<number>(`/account/notification-count`);
    }

    public readNotification(id: number): Observable<never> {
        return this._apiService.post<never>(
            `/account/notifications/${id}/read`
        );
    }

    public getTasks(attributes: TasksListParams): Observable<TasksList> {
        const httpParams = new HttpParams()
            .set("count", attributes.count.toString() || "")
            .set("offset", attributes.offset.toString() || "");

        return this._apiService.get<TasksList>(`/account/tasks`, httpParams);
    }
}
