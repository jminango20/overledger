import { Module } from '@nestjs/common';
import { SchemaRegistryController } from './schema-registry.controller';
import { SchemaRegistryService } from './schema-registry.service';
import { BlockchainModule } from '../../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [SchemaRegistryController],
  providers: [SchemaRegistryService],
  exports: [SchemaRegistryService],
})
export class SchemaRegistryModule {}
