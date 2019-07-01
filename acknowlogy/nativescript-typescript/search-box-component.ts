import { Component, EventEmitter, Input, Output } from "@angular/core";
import * as platform from "tns-core-modules/platform/platform";
import { EventData, View } from "tns-core-modules/ui/core/view/view";
import { SearchBar } from "tns-core-modules/ui/search-bar/search-bar";
import { TextField } from "tns-core-modules/ui/text-field/text-field";

declare const UISearchBarStyle: any;

@Component({
    selector: "search-box",
    templateUrl: "shared/layout/search-box/search-box.component.html",
    styleUrls: ["shared/layout/search-box/search-box.scss"]
})

export class SearchBoxComponent {
    private _lastSearched: string;

    constructor() {
        this.iconColor = "#000000";
        this.searched = new EventEmitter<string>();
        this.searchText = "";
        this.searchTextColor = "#000000";
    }

    @Input()
    public iconColor: string;
    @Input()
    public hint: string;
    @Input()
    public searchText: string;
    @Input()
    public searchTextColor: string;

    @Output()
    public searched: EventEmitter<string>;

    public onClear() {
        if (this.searchText !== "") {
            this.searchText = "";

            this._emitSearch();
        }
    }

    public onSearchBarLoaded(args) {
        const sb = <SearchBar>args.object;

        if (platform.isIOS) {
            sb.ios.searchBarStyle = UISearchBarStyle.UISearchBarStyleMinimal;
        }
    }

    public onFocusSearch(args: EventData) {
        if (platform.isAndroid) {
            const view = <View>args.object;

            if (view) {
                // TODO Figure out how to focus the TextField sibling
            }
        }
    }

    public onSearch(args: EventData) {
        if (platform.isAndroid) {
            const textField = <TextField>args.object;

            if (textField) {
                this.searchText = textField.text;

                this._emitSearch();
            }
        } else if (platform.isIOS) {
            const searchBar = <SearchBar>args.object;

            if (searchBar) {
                this.searchText = searchBar.text;

                this._emitSearch();
            }
        }
    }

    private _emitSearch() {
        if (this._lastSearched !== this.searchText) {
            this._lastSearched = this.searchText;

            this.searched.emit(this.searchText);
        }
    }
}
