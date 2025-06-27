// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: true, // Permitir qualquer origem (ajustar em produção)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Transforma automaticamente os tipos
      whitelist: true, // Remove propriedades não definidas nos DTOs
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Blockchain API')
    .setDescription('API para interação com contratos inteligentes')
    .setVersion('1.0')
    .addTag('address-discovery', 'Gerenciamento de endereços de contratos')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-private-key',
        in: 'header',
        description: 'Chave privada da wallet para assinar transações',
      },
      'private-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Manter autorização entre reloads
    },
  });

  // Configurar porta
  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📚 Swagger disponível em: http://localhost:${port}/api`);
}

bootstrap();
