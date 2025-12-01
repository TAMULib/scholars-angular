import { Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'sortOrgPeople',
  pure: true
})
export class SortOrgPeople implements PipeTransform {

  private extractLastName(label: string): string {
    if (!label) return '';
    return label.split(',')[0].trim().toLowerCase();
  }

  private extractFirstName(label: string): string {
    if (!label) return '';
    const afterComma = label.split(',')[1] || '';
    return afterComma.trim().split(/\s+/)[0].toLowerCase();
  }

  private extractMiddleName(label: string): string {
    if (!label) return '';
    const afterComma = label.split(',')[1] || '';
    const parts = afterComma.trim().split(/\s+/);
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  }

  transform(people: any[], direction: 'ASC' | 'DESC' = 'ASC'): any[] {
    if (!Array.isArray(people) || people.length === 0) return people || [];

    const copy = [...people];

    copy.sort((a, b) => {
      const aLast = this.extractLastName(a.label);
      const bLast = this.extractLastName(b.label);

      let cmp = aLast.localeCompare(bLast);
      if (cmp !== 0) return cmp;

      const aFirst = this.extractFirstName(a.label);
      const bFirst = this.extractFirstName(b.label);

      cmp = aFirst.localeCompare(bFirst);
      if (cmp !== 0) return cmp;

      const aMiddle = this.extractMiddleName(a.label);
      const bMiddle = this.extractMiddleName(b.label);

      return aMiddle.localeCompare(bMiddle);
    });

    return copy;
  }
}
