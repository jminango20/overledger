import { Module } from '@nestjs/common';
import { ProcessRegistryController } from './process-registry.controller';
import { ProcessRegistryService } from './process-registry.service';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { ProcessEventParser } from './services/process-event-parser.service';
import { ProcessValidator } from './services/process-validator.service';

@Module({
  imports: [BlockchainModule],
  controllers: [ProcessRegistryController],
  providers: [ProcessRegistryService, ProcessEventParser, ProcessValidator],
  exports: [ProcessRegistryService],
})
export class ProcessRegistryModule {}
