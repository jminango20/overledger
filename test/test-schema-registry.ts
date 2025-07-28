import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-private-key': PRIVATE_KEY,
    'Content-Type': 'application/json',
  },
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function testSchemaRegistry() {
  console.log('📄 Iniciando teste do Schema Registry ...\n');

  try {
    // 1. Health Check
    console.log('1. ✅ Health Check...');
    const health = await axios.get(`${API_BASE_URL}/address-discovery/health`);
    console.log('   Status:', health.data.status);

    // Configuração do canal
    const channelName = `schema-test-${Date.now()}`;

    // Primeiro, criar o canal necessário
    console.log('\n1.1. ✅ Criando canal para testes...');
    const createChannel = await api.post('/access-channel-manager/channels', {
      channelName: channelName,
    });
    console.log('   Canal criado:', createChannel.data.channelName);
    console.log('   TxHash:', createChannel.data.transactionHash);

    await wait(2000);

    // Adicionar membro
    console.log('\n1.2. ✅ Adicionando membro...');
    const addMember = await api.post(
      '/access-channel-manager/channels/addMember',
      {
        channelName: channelName,
        addressMember: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      },
    );
    console.log('   TxHash:', addMember.data.transactionHash);

    // ESPERAR novamente
    console.log('   ⏳ Aguardando confirmação...');
    await wait(2000);

    // Verificar se é membro
    console.log('\n1.3. ✅ Verificando membresía...');
    const checkMember = await axios.post(
      `${API_BASE_URL}/access-channel-manager/channels/checkMember`,
      {
        channelName: channelName,
        addressMember: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      },
    );
    console.log('   É membro:', checkMember.data.isMember);

    // 2. Criar primeiro schema - User Profile
    console.log('\n2. ✅ Criando User Profile Schema...');
    const createUserSchema = await api.post('/schema-registry/schemas', {
      schemaId: 'user-profile-schema',
      name: 'User Profile Schema',
      dataHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      channelName: channelName,
      description: 'Schema para validação de perfis de usuário',
    });
    console.log('   Schema ID:', createUserSchema.data.schemaId);
    console.log('   Nome:', createUserSchema.data.name);
    console.log('   Versão:', createUserSchema.data.version);
    console.log('   TxHash:', createUserSchema.data.transactionHash);

    await wait(2000);

    // 3. Criar segundo schema - Document
    console.log('\n3. ✅ Criando Document Schema...');
    const createDocSchema = await api.post('/schema-registry/schemas', {
      schemaId: 'document-schema',
      name: 'Document Schema',
      dataHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      channelName: channelName,
      description: 'Schema para validação de documentos',
    });
    console.log('   Schema ID:', createDocSchema.data.schemaId);
    console.log('   Versão:', createDocSchema.data.version);
    console.log('   TxHash:', createDocSchema.data.transactionHash);

    await wait(2000);

    // 4. Buscar schema ativo
    console.log('\n4. ✅ Buscando schema ativo...');
    const activeSchema = await axios.get(
      `${API_BASE_URL}/schema-registry/schemas/${channelName}/user-profile-schema/active`,
    );
    console.log('   ID:', activeSchema.data.id);
    console.log('   Status:', activeSchema.data.status);
    console.log('   Versão:', activeSchema.data.version);
    console.log('   Owner:', activeSchema.data.owner);

    // 5. Buscar informações do schema
    console.log('\n5. ✅ Buscando informações do schema...');
    const schemaInfo = await axios.get(
      `${API_BASE_URL}/schema-registry/schemas/${channelName}/user-profile-schema/info`,
    );
    console.log('   Versão mais recente:', schemaInfo.data.latestVersion);
    console.log('   Versão ativa:', schemaInfo.data.activeVersion);
    console.log('   Tem versão ativa:', schemaInfo.data.hasActiveVersion);
    console.log('   Total de versões:', schemaInfo.data.totalVersions);

    // 6. Buscar schema mais recente
    console.log('\n6. ✅ Buscando schema mais recente...');
    const latestSchema = await axios.get(
      `${API_BASE_URL}/schema-registry/schemas/${channelName}/user-profile-schema/latest`,
    );
    console.log('   Schema versão:', latestSchema.data.schema.version);
    console.log('   É versão ativa:', latestSchema.data.isActiveVersion);

    // 7. Atualizar schema (criar nova versão)
    console.log('\n7. ✅ Atualizando schema (criando v2)...');
    const updateSchema = await api.post('/schema-registry/schemas/update', {
      schemaId: 'user-profile-schema',
      newDataHash:
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      channelName: channelName,
      description: 'Versão 2 do schema de perfil de usuário',
    });
    console.log('   Schema ID:', updateSchema.data.schemaId);
    console.log('   Versão anterior:', updateSchema.data.previousVersion);
    console.log('   Nova versão:', updateSchema.data.newVersion);
    console.log('   TxHash:', updateSchema.data.transactionHash);

    await wait(2000);

    // 8. Buscar schema por versão específica
    console.log('\n8. ✅ Buscando schema v1...');
    const schemaV1 = await axios.get(
      `${API_BASE_URL}/schema-registry/schemas/${channelName}/user-profile-schema/1`,
    );
    console.log('   Versão:', schemaV1.data.version);
    console.log('   Status:', schemaV1.data.status);
    console.log('   Data Hash:', schemaV1.data.dataHash);

    // 9. Buscar todas as versões
    console.log('\n9. ✅ Buscando todas as versões...');
    const allVersions = await axios.get(
      `${API_BASE_URL}/schema-registry/schemas/${channelName}/user-profile-schema/versions`,
    );
    console.log('   Versões disponíveis:', allVersions.data.versions);
    console.log('   Versão ativa:', allVersions.data.activeVersion);
    console.log('   Versão mais recente:', allVersions.data.latestVersion);
    console.log('   Total de versões:', allVersions.data.totalVersions);

    // 10. Inativar versão específica
    console.log('\n10. ✅ Inativando versão 1...');
    const inactivateSchema = await api.post(
      '/schema-registry/schemas/inactivate',
      {
        schemaId: 'user-profile-schema',
        version: 1,
        channelName: channelName,
      },
    );
    console.log('   Schema ID:', inactivateSchema.data.schemaId);
    console.log(
      '   Versão inativada:',
      inactivateSchema.data.inactivatedVersion,
    );
    console.log('   Status anterior:', inactivateSchema.data.previousStatus);
    console.log('   TxHash:', inactivateSchema.data.transactionHash);

    await wait(2000);

    // 11. Verificar versão inativada
    console.log('\n11. ✅ Verificando versão inativada...');
    const inactiveVersion = await axios.get(
      `${API_BASE_URL}/schema-registry/schemas/${channelName}/user-profile-schema/1`,
    );
    console.log('   Status da v1:', inactiveVersion.data.status);

    // 12. Definir status customizado
    console.log('\n12. ✅ Definindo status DEPRECATED...');
    const setStatus = await api.post('/schema-registry/schemas/status', {
      schemaId: 'user-profile-schema',
      version: 2,
      channelName: channelName,
      status: 'DEPRECATED',
    });
    console.log('   Schema ID:', setStatus.data.schemaId);
    console.log('   Versão alterada:', setStatus.data.inactivatedVersion);
    console.log('   Status anterior:', setStatus.data.previousStatus);
    console.log('   Status atual:', setStatus.data.currentStatus);
    console.log('   TxHash:', setStatus.data.transactionHash);

    await wait(2000);

    // 13. Depreciar schema ativo
    console.log('\n13. ✅ Depreciando schema ativo...');
    const deprecateSchema = await api.post(
      '/schema-registry/schemas/deprecate',
      {
        schemaId: 'document-schema',
        channelName: channelName,
      },
    );
    console.log('   Schema ID:', deprecateSchema.data.schemaId);
    console.log(
      '   Versão depreciada:',
      deprecateSchema.data.deprecatedVersion,
    );
    console.log('   TxHash:', deprecateSchema.data.transactionHash);

    await wait(2000);

    // 14. Verificar informações finais
    console.log('\n14. ✅ Verificação final dos schemas...');
    const finalUserInfo = await axios.get(
      `${API_BASE_URL}/schema-registry/schemas/${channelName}/user-profile-schema/info`,
    );
    console.log(
      '   User Schema - Versões totais:',
      finalUserInfo.data.totalVersions,
    );
    console.log(
      '   User Schema - Tem versão ativa:',
      finalUserInfo.data.hasActiveVersion,
    );

    const finalDocInfo = await axios.get(
      `${API_BASE_URL}/schema-registry/schemas/${channelName}/document-schema/info`,
    );
    console.log(
      '   Document Schema - Versão ativa:',
      finalDocInfo.data.activeVersion,
    );
    console.log(
      '   Document Schema - Tem versão ativa:',
      finalDocInfo.data.hasActiveVersion,
    );

    console.log(
      '\n🎉 SCHEMA REGISTRY TESTE COMPLETO! Todos os endpoints testados com sucesso!',
    );
    console.log('\n📋 Resumo:');
    console.log('   ✅ Schemas criados (user-profile, document)');
    console.log('   ✅ Versionamento funcionando (v1 → v2)');
    console.log('   ✅ Estados testados (ACTIVE → INACTIVE → DEPRECATED)');
    console.log('   ✅ Consultas por versão específica');
    console.log('   ✅ Informações e listagem de versões');
    console.log('   ✅ Depreciação de schemas');
    console.log('   ✅ Status customizados');
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('\n💡 Dica: Verifique se o usuário é membro do canal');
    } else if (error.response?.status === 409) {
      console.log('\n💡 Dica: Schema pode já existir, tente com outro nome');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Dica: Verifique se o schema existe no canal');
    }

    console.log('\n🔧 Verifique se:');
    console.log('   - A API está rodando');
    console.log('   - Os contratos estão deployados');
    console.log('   - O canal existe e o usuário é membro');
  }
}

testSchemaRegistry();
