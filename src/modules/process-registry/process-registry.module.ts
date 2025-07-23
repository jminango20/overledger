import { Module } from '@nestjs/common';
import { ProcessRegistryController } from './process-registry.controller';
import { ProcessRegistryService } from './process-registry.service';
import { BlockchainModule } from '../../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [ProcessRegistryController],
  providers: [ProcessRegistryService],
  exports: [ProcessRegistryService],
})
export class ProcessRegistryModule {}
