import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from '../../core/store';
import { fadeIn } from '../../shared/utilities/animation.utility';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

@Component({
  selector: 'scholars-quantity-distribution',
  templateUrl: './quantity-distribution.component.html',
  styleUrls: ['./quantity-distribution.component.scss'],
  animations: [fadeIn],
})
export class QuantityDistributionComponent implements OnDestroy, OnInit {

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {
    
  }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    if (this.route.parent && this.route.parent.data) {

    }
  }

}
