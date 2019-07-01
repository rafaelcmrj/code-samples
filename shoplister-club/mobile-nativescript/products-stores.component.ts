import { Component, OnInit, NgZone } from "@angular/core";
import { Store } from "~/app/shared/models/store.model";
import { HelperService } from "~/app/shared/services/helper.service";
import { SearchBar } from "tns-core-modules/ui/search-bar";
import { ItemEventData } from "tns-core-modules/ui/list-view";
import { RouterExtensions } from "nativescript-angular/router";
import * as firebase from "nativescript-plugin-firebase";

@Component({
    selector: "ProductsStores",
    moduleId: module.id,
    templateUrl: "./products-stores.component.html",
    styleUrls: ['./products-stores.component.scss'],
})
export class ProductsStoresComponent implements OnInit {

    public items: Array<Store>;
    public searchText: string;

    constructor(private _helperService: HelperService, private _routerExtensions: RouterExtensions, private _ngZone: NgZone) { }

    ngOnInit(): void {
        firebase.query((data: any) => {
            if (data.value) {
                this._ngZone.run(() => {
                    this.items = this._helperService.firebaseObjectToArray(data.value).filter((item, index, items) => {
                        item.commission = item.commission_max > item.commission_min ? (Math.floor(item.commission_min) / 2) + '% - ' + (Math.floor(item.commission_max) / 2) + '%' : (Math.floor(item.commission_min) / 2) + '%';

                        return item;
                    }).reverse();
                });
            }
        }, '/stores', {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.CHILD,
                    value: 'commission_min'
                }
            });
    }

    onSearchBarSubmit(args) {
        if (args.object.android) {
            args.object.android.clearFocus();
        }

        let searchBar = <SearchBar>args.object;
        this.searchText = searchBar.text;
    }

    onSearchBarClear(args) {
        if (args.object.android) {
            args.object.android.clearFocus();
        }

        this.searchText = '';
    }

    onSearchBarLoaded(args) {
        if (args.object.android) {
            args.object.android.clearFocus();
        }
    }

    onItemTap(args: ItemEventData) {
        const index = args.index;
        const store = args.view.bindingContext;

        this._routerExtensions.navigate(['/products/add/' + store._key]);
    }
}
