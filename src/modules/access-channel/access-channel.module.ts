import { Module } from '@nestjs/common';
import { AccessChannelController } from './access-channel.controller';
import { AccessChannelService } from './access-channel.service';
import { BlockchainModule } from '../../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [AccessChannelController],
  providers: [AccessChannelService],
  exports: [AccessChannelService],
})
export class AccessChannelModule {}
