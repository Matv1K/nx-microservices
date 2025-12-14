import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  healthCheck() {
    console.log('Health check for Posts');
    
    return {
      success: true,
      message: 'Posts microservice is running',
      timestamp: new Date().toISOString(),
    };
  }
}
