import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { SearchAttributes, SearchAttributesPriceFilter } from '../models/product-search.model';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { HelperService } from './helper.service';
import { Store } from '../models/store.model';

const API_URL = 'https://e6169fy0yk.execute-api.sa-east-1.amazonaws.com/beta';

@Injectable()
export class ApiService {

    constructor(
        private http: HttpClient
    ) {
    }

    public get(attributes: SearchAttributes): Observable<any> {
        const url = API_URL;
        return this.http.get(url, {
            params: this._buildQuery(attributes)
        });
    }

    private _buildQuery(attributes: SearchAttributes): {} {

        let statements = [];

        if (attributes.filters.price.min > 0 || attributes.filters.price.max > 0) {
            statements.push(this._priceFilterQuery(attributes.filters.price));
        }

        if (attributes.filters.stores && attributes.filters.stores.length > 0) {
            statements.push(this._storeFilterQuery(attributes.filters.stores));
        }

        if (attributes.filters.category) {
            statements.push(this._categoryFilterQuery(attributes.filters.category));
        }

        if (attributes.filters.string) {
            statements.push(this._stringFilterQuery(attributes.filters.string));
        }

        if (attributes.products) {
            statements.push(this._productsQuery(attributes.products));
        }

        const qQuery = '(and ' + statements.join(' ') + ')';

        const query = {
            'q': qQuery,
            'q.parser': 'structured',
            'start': attributes.pagination.start,
            'size': attributes.pagination.size,
            'facet.price': '{}',
            'facet.store': '{}',
            'facet.merchant_category_path': '{}',
            'facet.merchant_main_category': '{}',
            'facet.color': '{}',
            'sort': attributes.order
        };

        return query;
    }

    private _priceFilterQuery(priceFilter: SearchAttributesPriceFilter) {
        const max = priceFilter.max > 0 ? priceFilter.max + ']' : '}';
        const range = '[' + priceFilter.min + ',' + max;

        return '(range field=price ' + range + ')';
    }

    private _storeFilterQuery(stores: Array<string>) {
        let storesKeys = new Array();
        stores.forEach(store => {
            storesKeys.push('store:\'' + store + '\'');
        });

        return '(or ' + storesKeys.join(' ') + ')';
    }

    private _categoryFilterQuery(category: string) {
        return '(or merchant_category_path: \'' + category + '\')';
    }

    private _stringFilterQuery(string: string) {
        return '(or (term field=store \'' + string + '\') (term field=name \'' + string + '\')  (term field=description \'' + string + '\')  (term field=manufacturer \'' + string + '\')  (term field=deep_link \'' + string + '\') (term field=merchant_category_path \'' + string + '\') (term field=long_description \'' + string + '\'))';
    }

    private _productsQuery(products: string[]) {
        let ids = new Array();
        products.forEach(product => {
            ids.push('_id:\'' + product + '\'');
        });

        return '(or ' + ids.join(' ') + ')';
    }
}