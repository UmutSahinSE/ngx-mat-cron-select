import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'translateOrUseDefault' })
export class TranslateOrUseDefaultPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(key: string, defaultValue: string, interpolateParams?: Object): string {
    const translation = this.translate.instant(key, interpolateParams);

    return translation === key ? defaultValue : translation;
  }
}
