import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherLoggerService {

  private readonly BACKEND_URL = environment.backendUrl;

  constructor(private http: HttpClient, private apiService: ApiService) { }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    const timestamp = new Date().toLocaleString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    const styles = {
      info: 'color: #2196F3; font-weight: bold;',
      success: 'color: #4CAF50; font-weight: bold;',
      error: 'color: #F44336; font-weight: bold;',
      warning: 'color: #FF9800; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] ${emoji[type]} ${message}`,
      styles[type]
    );
  }

  info(message: string): void {
    this.log(message, 'info');
  }

  success(message: string): void {
    this.log(message, 'success');
  }

  error(message: string): void {
    this.log(message, 'error');
  }

  warning(message: string): void {
    this.log(message, 'warning');
  }

  weather(message: string): void {
    console.log(
      `%c[${new Date().toLocaleString()}] 🌤️ ${message}`,
      'color: #00BCD4; font-weight: bold;'
    );
  }

  async testBackendConnection(): Promise<boolean> {
    try {
      this.info('Testing backend connection...');

      const response = await this.apiService.checkHealth().toPromise();

      this.success('Backend connection successful!');
      this.info('Backend API server is running and accessible');

      return true;

    } catch (error: any) {
      this.error('Backend connection failed!');

      if (error.status === 0) {
        this.error('Backend server is not running or CORS is blocking the request');
        this.warning('Make sure backend server is started: cd src/backend-api && npm start');
      } else {
        this.error(`Backend error: ${error.status} - ${error.message}`);
      }

      return false;
    }
  }

  async testWeatherAPI(): Promise<boolean> {
    try {
      this.info('Testing weather API through backend...');

      const response: any = await this.apiService.getWeather().toPromise();

      if (response.success) {
        const data = response.data;
        this.success('Weather API is working through backend!');
        this.weather(`Current weather: ${data.temperature}°C, ${data.description} in ${data.location}`);

        if (data.fallback) {
          this.warning('Backend is using fallback weather data (OpenWeatherMap API may be down)');
        } else {
          this.success('Real weather data received from OpenWeatherMap API');
        }

        return true;
      } else {
        throw new Error('Backend returned unsuccessful response');
      }

    } catch (error: any) {
      this.error('Weather API test failed!');

      if (error.status === 0) {
        this.error('Cannot reach backend server - make sure it\'s running on port 3000');
      } else if (error.status === 500) {
        this.error('Backend server error - check backend logs');
      } else {
        this.error(`Weather API error: ${error.status} - ${error.message}`);
      }

      return false;
    }
  }

  logAngularStart(): void {
    console.log('\n' + '='.repeat(60));
    this.success('Angular Frontend started successfully');
    this.info('Dashboard component initializing...');
    this.info('Weather widget preparing...');
    console.log('='.repeat(60) + '\n');
  }

  logWeatherUpdate(temperature: string, location: string): void {
    this.weather(`Weather updated: ${temperature} in ${location}`);
  }

  logWeatherUpdateScheduled(): void {
    this.info('Weather updates scheduled every 10 minutes');
  }

  logBackendNotRunning(): void {
    this.error('Backend is not running!');
    this.warning('Weather data will use fallback simulation');
    this.info('To fix: Start backend server with "cd src/backend-api && npm start"');
  }

  async performStartupTests(): Promise<void> {
    this.logAngularStart();
    
    // Test backend connection
    const backendWorking = await this.testBackendConnection();
    
    if (backendWorking) {
      // Test weather API
      const weatherWorking = await this.testWeatherAPI();
      
      if (weatherWorking) {
        this.success('🌤️ Weather API is now ready and working!');
        this.logWeatherUpdateScheduled();
      } else {
        this.warning('Weather API not working - will use fallback data');
      }
    } else {
      this.logBackendNotRunning();
    }
    
    this.info('Frontend initialization complete');
  }
}
