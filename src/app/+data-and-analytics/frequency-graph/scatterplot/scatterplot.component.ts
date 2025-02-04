import { ChangeDetectionStrategy, Component, Inject, PLATFORM_ID } from '@angular/core';

import { id } from '../../../shared/utilities/id.utility';

@Component({
  selector: 'scholars-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScatterplotComponent {

  public id: string;

  constructor(@Inject(PLATFORM_ID) private platformId: string) {
    this.id = id();
  }

}
