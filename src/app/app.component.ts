import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QuoteSchedulerService } from './services/quote-scheduler.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'Library-Management-System-AI';

  constructor(private quoteScheduler: QuoteSchedulerService) {}

  ngOnInit(): void {
    // Quote scheduler is automatically initialized via dependency injection
    console.log('📱 App initialized with Quote Scheduler');
  }
}