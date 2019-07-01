import { Component, OnInit, Input, Output } from "@angular/core";
import { Load } from "./../../models/";
import { BehaviorSubject } from "rxjs";
import { ListView } from "tns-core-modules/ui/list-view/list-view";
import { isIOS } from "tns-core-modules/ui/page/page";
import { ObservableArray } from "tns-core-modules/data/observable-array/observable-array";

@Component({
    selector: "LoadsList",
    moduleId: module.id,
    templateUrl: "./loads-list.component.html",
    styleUrls: ["loads-list.component.scss"]
})
export class LoadsListComponent implements OnInit {

    @Input() loading = false;

    private loads: Array<Load> = [];
    private subject = new BehaviorSubject<Array<Load>>([]);
    private listView: ListView;
    private _dataItems: ObservableArray<any>;

    @Input()
    set data(value: Array<Load>) {
        this.subject.next(value);
    };

    get data(): Array<Load> {
        return this.subject.getValue();
    }

    get dataItems(): ObservableArray<any> {
        return this._dataItems;
    }

    ngOnInit() {
        this.subject
            .subscribe(() => {
                if (this.data) {
                    this.loads = this.data;
                    this._dataItems = new ObservableArray(this.loads);
                }
            });
    }

    onListViewLoaded(args): void {
        this.listView = args.object;

        if (isIOS) {
            this.listView.ios.allowsSelection = false;
        }
    }

    loadMoreItems(): void {
        console.log('Load More');
    }

    reload(): void {
        console.log('Reload');
    }
}
