import { Module } from '@nestjs/common';
import { SchemaRegistryController } from './schema-registry.controller';
import { SchemaRegistryService } from './schema-registry.service';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { SchemaEventParser } from './services/schema-event-parser.service';
import { SchemaValidator } from './services/schema-validator.service';

@Module({
  imports: [BlockchainModule],
  controllers: [SchemaRegistryController],
  providers: [SchemaRegistryService, SchemaEventParser, SchemaValidator],
  exports: [SchemaRegistryService],
})
export class SchemaRegistryModule {}
