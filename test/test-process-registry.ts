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

async function testProcessRegistry() {
  console.log('⚙️ Iniciando teste do Process Registry ...\n');

  try {
    // 1. Health Check
    console.log('1. ✅ Health Check...');
    const health = await axios.get(`${API_BASE_URL}/address-discovery/health`);
    console.log('   Status:', health.data.status);

    // Configuração
    const channelName = `process-test-${Date.now()}`;

    // 2. Setup: Criar canal e schemas necessários
    console.log('\n2. 🔧 Setup: Criando canal...');
    const createChannel = await api.post('/access-channel-manager/channels', {
      channelName: channelName,
    });
    console.log('   Canal criado:', createChannel.data.channelName);

    await wait(2000);

    console.log('\n2.1. ✅ Adicionando membro...');
    const addMember = await api.post(
      '/access-channel-manager/channels/addMember',
      {
        channelName: channelName,
        addressMember: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      },
    );
    console.log('   TxHash:', addMember.data.transactionHash);

    console.log('   ⏳ Aguardando confirmação...');
    await wait(2000);

    console.log('\n2.2. ✅ Verificando membresía...');
    const checkMember = await axios.post(
      `${API_BASE_URL}/access-channel-manager/channels/checkMember`,
      {
        channelName: channelName,
        addressMember: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      },
    );
    console.log('   É membro:', checkMember.data.isMember);

    console.log('\n2.3. 🔧 Setup: Criando schemas necessários...');

    // Schema para user profile
    const userSchema = await api.post('/schema-registry/schemas', {
      schemaId: 'user-profile-schema',
      name: 'User Profile Schema',
      dataHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      channelName: channelName,
      description: 'Schema para perfis de usuário',
    });
    console.log('   User Schema criado:', userSchema.data.schemaId);

    await wait(2000);

    // Schema para documentos
    const docSchema = await api.post('/schema-registry/schemas', {
      schemaId: 'document-schema',
      name: 'Document Schema',
      dataHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      channelName: channelName,
      description: 'Schema para documentos',
    });
    console.log('   Document Schema criado:', docSchema.data.schemaId);

    await wait(2000);

    // Schema para assets
    const assetSchema = await api.post('/schema-registry/schemas', {
      schemaId: 'asset-schema',
      name: 'Asset Schema',
      dataHash:
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      channelName: channelName,
      description: 'Schema para assets',
    });
    console.log('   Asset Schema criado:', assetSchema.data.schemaId);

    await wait(2000);

    // 3. Criar processo de onboarding de usuário
    console.log('\n3. ✅ Criando processo de User Onboarding...');
    const createUserProcess = await api.post('/process-registry/processes', {
      processId: 'user-onboarding',
      natureId: 'user-management',
      stageId: 'registration',
      schemas: [
        {
          schemaId: 'user-profile-schema',
          version: 1,
        },
      ],
      action: 'CREATE_ASSET',
      description: 'Processo de onboarding de novos usuários',
      channelName: channelName,
    });
    console.log('   Process ID:', createUserProcess.data.processId);
    console.log('   Nature ID:', createUserProcess.data.natureId);
    console.log('   Stage ID:', createUserProcess.data.stageId);
    console.log('   Action:', createUserProcess.data.action);
    console.log('   TxHash:', createUserProcess.data.transactionHash);

    await wait(2000);

    // 4. Criar processo de criação de documentos
    console.log('\n4. ✅ Criando processo de Document Creation...');
    const createDocProcess = await api.post('/process-registry/processes', {
      processId: 'document-creation',
      natureId: 'document-management',
      stageId: 'creation',
      schemas: [
        {
          schemaId: 'document-schema',
          version: 1,
        },
        {
          schemaId: 'user-profile-schema',
          version: 1,
        },
      ],
      action: 'CREATE_DOCUMENT', // 2
      description: 'Processo de criação de documentos',
      channelName: channelName,
    });
    console.log('   Process ID:', createDocProcess.data.processId);
    console.log('   Action:', createDocProcess.data.action);
    console.log('   TxHash:', createDocProcess.data.transactionHash);

    await wait(2000);

    // 5. Criar processo de transferência de asset
    console.log('\n5. ✅ Criando processo de Asset Transfer...');
    const createAssetProcess = await api.post('/process-registry/processes', {
      processId: 'asset-transfer',
      natureId: 'asset-management',
      stageId: 'transfer',
      schemas: [
        {
          schemaId: 'asset-schema',
          version: 1,
        },
        {
          schemaId: 'user-profile-schema',
          version: 1,
        },
      ],
      action: 'TRANSFER_ASSET', // 3
      description: 'Processo de transferência de assets entre usuários',
      channelName: channelName,
    });
    console.log('   Process ID:', createAssetProcess.data.processId);
    console.log('   Action:', createAssetProcess.data.action);
    console.log('   TxHash:', createAssetProcess.data.transactionHash);

    await wait(2000);

    // 6. Criar segundo estágio do onboarding (mesmo processId)
    console.log('\n6. ✅ Criando segundo estágio do User Onboarding...');
    const createVerificationProcess = await api.post(
      '/process-registry/processes',
      {
        processId: 'user-onboarding', // Mesmo processId
        natureId: 'user-management',
        stageId: 'verification', // Estágio diferente
        schemas: [
          {
            schemaId: 'user-profile-schema',
            version: 1,
          },
          {
            schemaId: 'document-schema',
            version: 1,
          },
        ],
        action: 'UPDATE_ASSET', // 1
        description: 'Processo de verificação no onboarding',
        channelName: channelName,
      },
    );
    console.log('   Process ID:', createVerificationProcess.data.processId);
    console.log('   Stage ID:', createVerificationProcess.data.stageId);
    console.log('   Action:', createVerificationProcess.data.action);

    await wait(2000);

    // 7. Buscar processo específico
    console.log('\n7. ✅ Buscando processo específico...');
    const getProcess = await axios.get(
      `${API_BASE_URL}/process-registry/processes/${channelName}/user-onboarding/user-management/registration`,
    );
    console.log('   Process ID:', getProcess.data.processId);
    console.log('   Status:', getProcess.data.status);
    console.log('   Action:', getProcess.data.action);
    console.log('   Schemas count:', getProcess.data.schemas.length);
    console.log('   Owner:', getProcess.data.owner);
    console.log(
      '   Created at:',
      new Date(getProcess.data.createdAt * 1000).toLocaleString(),
    );

    // 8. Buscar todos os processos por processId
    console.log('\n8. ✅ Buscando todos os estágios do user-onboarding...');
    const getAllProcesses = await axios.get(
      `${API_BASE_URL}/process-registry/processes/${channelName}/user-onboarding`,
    );
    console.log(
      '   Total de estágios encontrados:',
      getAllProcesses.data.length,
    );
    getAllProcesses.data.forEach((process: any, index: number) => {
      console.log(
        `   Estágio ${index + 1}:`,
        process.stageId,
        '- Action:',
        process.action,
      );
    });

    // 9. Verificar se processo está ativo
    console.log('\n9. ✅ Verificando se processo está ativo...');
    const isActive = await axios.get(
      `${API_BASE_URL}/process-registry/processes/${channelName}/user-onboarding/user-management/registration/active`,
    );
    console.log('   Processo está ativo:', isActive.data.isActive);

    // 10. Validar processo para submissão
    console.log('\n10. ✅ Validando processo para submissão...');
    const validateProcess = await axios.get(
      `${API_BASE_URL}/process-registry/processes/${channelName}/user-onboarding/user-management/registration/validate`,
    );
    console.log('   Processo é válido:', validateProcess.data.isValid);
    if (validateProcess.data.reason) {
      console.log('   Razão:', validateProcess.data.reason);
    }

    // 11. Obter apenas o status do processo
    console.log('\n11. ✅ Obtendo status do processo...');
    const getStatus = await axios.get(
      `${API_BASE_URL}/process-registry/processes/${channelName}/document-creation/document-management/creation/status`,
    );
    console.log('   Status:', getStatus.data.status);
    console.log('   Status Code:', getStatus.data.statusCode);

    // 12. Atualizar status do processo para INACTIVE
    console.log('\n12. ✅ Inativando processo de document-creation...');
    const updateStatus = await api.post('/process-registry/processes/status', {
      processId: 'document-creation',
      natureId: 'document-management',
      stageId: 'creation',
      channelName: channelName,
      newStatus: 'INACTIVE', // 1
    });
    console.log('   Process ID:', updateStatus.data.processId);
    console.log('   Status anterior:', updateStatus.data.previousStatus);
    console.log('   Novo status:', updateStatus.data.newStatus);
    console.log('   TxHash:', updateStatus.data.transactionHash);

    await wait(2000);

    // 13. Inativar processo usando método de conveniência
    console.log(
      '\n13. ✅ Inativando asset-transfer usando método de conveniência...',
    );
    const inactivateProcess = await api.post(
      '/process-registry/processes/inactivate',
      {
        processId: 'asset-transfer',
        natureId: 'asset-management',
        stageId: 'transfer',
        channelName: channelName,
      },
    );
    console.log('   Process ID:', inactivateProcess.data.processId);
    console.log('   Novo status:', inactivateProcess.data.newStatus);
    console.log('   TxHash:', inactivateProcess.data.transactionHash);

    await wait(2000);

    // 14. Verificar status atualizado
    console.log('\n14. ✅ Verificando status atualizado...');
    const verifyInactive = await axios.get(
      `${API_BASE_URL}/process-registry/processes/${channelName}/asset-transfer/asset-management/transfer/active`,
    );
    console.log('   Asset-transfer ainda ativo:', verifyInactive.data.isActive);

    // 15. Criar processo complexo com múltiplos schemas
    console.log('\n15. ✅ Criando processo complexo de transformação...');
    const complexProcess = await api.post('/process-registry/processes', {
      processId: 'asset-transformation',
      natureId: 'asset-management',
      stageId: 'complex-transform',
      schemas: [
        {
          schemaId: 'asset-schema',
          version: 1,
        },
        {
          schemaId: 'user-profile-schema',
          version: 1,
        },
        {
          schemaId: 'document-schema',
          version: 1,
        },
      ],
      action: 'TRANSFORM_ASSET', // 4
      description: 'Processo complexo de transformação de assets',
      channelName: channelName,
    });
    console.log('   Process ID:', complexProcess.data.processId);
    console.log('   Action:', complexProcess.data.action);
    console.log('   Schemas utilizados: 3');

    await wait(2000);

    // 16. Validação final - contabilizar processos criados
    console.log('\n16. ✅ Validação final...');
    const finalUserProcesses = await axios.get(
      `${API_BASE_URL}/process-registry/processes/${channelName}/user-onboarding`,
    );
    console.log(
      '   Total de estágios do user-onboarding:',
      finalUserProcesses.data.length,
    );

    // 17. Teste de validação do processo complexo
    console.log('\n17. ✅ Validando processo complexo...');
    const validateComplex = await axios.get(
      `${API_BASE_URL}/process-registry/processes/${channelName}/asset-transformation/asset-management/complex-transform/validate`,
    );
    console.log('   Processo complexo é válido:', validateComplex.data.isValid);

    console.log(
      '\n🎉 PROCESS REGISTRY TESTE COMPLETO! Todos os endpoints testados com sucesso!',
    );
    console.log('\n📋 Resumo dos Processos Criados:');
    console.log(
      '   ✅ User Onboarding (2 estágios: registration + verification)',
    );
    console.log('   ✅ Document Creation (inativado)');
    console.log('   ✅ Asset Transfer (inativado)');
    console.log('   ✅ Asset Transformation (complexo com 3 schemas)');
    console.log('\n⚙️ Funcionalidades Testadas:');
    console.log('   ✅ Criação de processos com múltiplos schemas');
    console.log('   ✅ Processos multi-estágio (mesmo processId)');
    console.log(
      '   ✅ Diferentes ações (CREATE_ASSET, UPDATE_ASSET, CREATE_DOCUMENT, etc.)',
    );
    console.log('   ✅ Atualização de status (ACTIVE → INACTIVE)');
    console.log('   ✅ Validação para submissão');
    console.log('   ✅ Consultas por processId e específicas');
    console.log('   ✅ Verificação de status ativo');
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('\n💡 Dica: Verifique se o usuário é membro do canal');
    } else if (error.response?.status === 409) {
      console.log('\n💡 Dica: Processo pode já existir com essa combinação');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Dica: Verifique se o processo/schema existe');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Dica: Verifique os parâmetros enviados');
    }

    console.log('\n🔧 Verifique se:');
    console.log('   - A API está rodando');
    console.log('   - Os contratos estão deployados');
    console.log('   - Os schemas existem e estão ativos');
    console.log('   - O canal existe e o usuário é membro');
    console.log('   - Os schemas não têm duplicatas');
  }
}

testProcessRegistry();
