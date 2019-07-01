import { Component, OnInit, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Notification } from "./../../models";

@Component({
    selector: "Notification",
    moduleId: module.id,
    templateUrl: "./notification.component.html",
    styleUrls: ["notification.component.scss"]
})
export class NotificationComponent implements OnInit {
    private notification: Notification;
    private subject = new BehaviorSubject<Notification>(null);

    @Input()
    set data(value: Notification) {
        this.subject.next(value);
    }

    get data(): Notification {
        return this.subject.getValue();
    }

    ngOnInit() {
        this.subject
            .subscribe(() => {
                this.notification = this.data;
            });
    }
}
