import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterMuscle', standalone: true })
export class FilterMusclePipe implements PipeTransform {
  transform(items: any[], muscle: string): any[] {
    if (!Array.isArray(items)) return [];
    return items.filter(e => e?.muscle === muscle);
  }
}

@Pipe({ name: 'filterEx', standalone: true })
export class FilterExPipe implements PipeTransform {
  transform(items: any[], muscle: string): any[] {
    if (!Array.isArray(items)) return [];
    return items.filter(e => e?.muscle === muscle);
  }
}
