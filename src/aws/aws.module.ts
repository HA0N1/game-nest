import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';

@Module({
  controllers: [],
  providers: [AwsService],
})
export class AwsModule {}
