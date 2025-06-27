import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainProvider } from './providers/blockchain.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [BlockchainProvider],
  exports: [BlockchainProvider],
})
export class BlockchainModule {}
