import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogingComponent } from './cataloging.component';

@Component({
  selector: 'app-cataloging-route',
  standalone: true,
  imports: [CommonModule, CatalogingComponent],
  template: `<app-cataloging></app-cataloging>`
})
export class CatalogingRouteComponent {
  constructor() { }
}