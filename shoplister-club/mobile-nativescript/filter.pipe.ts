import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], searchText: string): any[] {
        if (!items) return [];
        if (!searchText) return items;
        searchText = searchText.toLowerCase();

        return items.filter(item => {
            if (typeof item == 'string') {
                return item.toLowerCase().includes(searchText);
            } else if (typeof item == 'object') {
                let contain: boolean = false;
                const keys = Object.keys(item);

                keys.forEach((key) => {
                    if (typeof item[key] == 'string' && item[key].toLowerCase().includes(searchText)) {
                        contain = true;
                    }
                });

                return contain;
            }
        });
    }
}