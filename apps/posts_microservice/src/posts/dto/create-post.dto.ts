import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  userId?: number; // Optional for now since no auth middleware
}

