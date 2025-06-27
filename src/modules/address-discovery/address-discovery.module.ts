import { Module } from '@nestjs/common';
import { AddressDiscoveryController } from './address-discovery.controller';
import { AddressDiscoveryService } from './address-discovery.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BlockchainModule } from '../../blockchain/blockchain.module';

@Module({
  imports: [
    PrismaModule, // Para acesso ao banco de dados
    BlockchainModule, // Para interação com blockchain
  ],
  controllers: [
    AddressDiscoveryController, // Endpoints REST
  ],
  providers: [
    AddressDiscoveryService, // Lógica de negócio
  ],
  exports: [
    AddressDiscoveryService, // Exporta para outros módulos poderem usar
  ],
})
export class AddressDiscoveryModule {}
