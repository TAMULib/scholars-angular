import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  pure: true
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], filter: any): any[] {
    if (!items) {
      return [];
    }
    if (!filter) {
      return items;
    }
    return items.filter((item: any) => {
      for (const key in filter) {
        if (filter.hasOwnProperty(key)) {
          if (filter[key].startsWith('!')) {
            if (filter[key].endsWith(item[key])) {
              return false;
            }
          } else {
            if (item[key] !== filter[key]) {
              return false;
            }
          }
        }
      }
      return true;
    });
  }
}
