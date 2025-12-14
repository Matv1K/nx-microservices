import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { PrismaService } from './prisma/prisma.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PostsModule, HealthModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
