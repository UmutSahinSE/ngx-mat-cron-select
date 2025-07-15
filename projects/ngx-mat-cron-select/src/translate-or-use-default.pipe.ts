import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'translateOrUseDefault' })
export class TranslateOrUseDefaultPipe implements PipeTransform {
  private readonly translate = inject(TranslateService, { optional: true });

  public transform(key: string, defaultValue: string, interpolateParams?: Object): string {
    const translation = this.translate?.instant(key, interpolateParams) ?? defaultValue;

    return translation === key ? defaultValue : translation;
  }
}
