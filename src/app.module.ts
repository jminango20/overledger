import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AddressDiscoveryModule } from './modules/address-discovery/address-discovery.module';
import { AccessChannelModule } from './modules/access-channel/access-channel.module';

@Module({
  imports: [
    // Configuração global
    ConfigModule.forRoot({
      isGlobal: true, // Torna disponível em toda a aplicação
      envFilePath: '.env',
    }),

    // Módulos de infraestrutura
    PrismaModule, // Banco de dados
    BlockchainModule, // Blockchain

    // Módulos de domínio
    AddressDiscoveryModule, // Nosso módulo principal
    AccessChannelModule, // Módulo de canais de acesso
  ],
})
export class AppModule {}
