import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animated-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="relative inline-flex items-center cursor-pointer group">
      <input 
        type="checkbox" 
        class="sr-only peer" 
        [checked]="checked"
        (change)="onChange($event)">
      <div class="relative w-12 h-6 bg-red-500 rounded-full peer transition-all duration-300 ease-in-out overflow-hidden"
           [class.bg-green-500]="checked">
        <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ease-in-out transform"
             [class.translate-x-6]="checked">
        </div>
      </div>
    </label>
  `,
  styles: [`
    .peer:focus ~ div {
      box-shadow: 0 0 0 4px rgba(72, 187, 120, 0.2);
    }
    
    .group:hover .peer ~ div {
      transform: scale(1.05);
    }
    
    .group:active .peer ~ div {
      transform: scale(0.95);
    }
  `]
})
export class AnimatedToggleComponent {
  @Input() checked: boolean = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  onChange(event: any): void {
    this.checked = event.target.checked;
    this.checkedChange.emit(this.checked);
  }
}