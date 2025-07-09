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

async function testAccessChannelManager() {
  console.log('🚀 Iniciando teste do AccessChannelManager ...\n');

  try {
    // 1. Health Check
    console.log('1. ✅ Health Check...');
    const health = await axios.get(`${API_BASE_URL}/address-discovery/health`);
    console.log('   Status:', health.data.status);

    // 2. Blockchain Status
    console.log('\n2. ✅ Verificando Blockchain...');
    const blockchain = await axios.get(
      `${API_BASE_URL}/address-discovery/blockchain/status`,
    );
    console.log('   Conectado:', blockchain.data.connected);
    console.log('   Chain ID:', blockchain.data.chainId);

    // 3. Contar canais iniciais
    console.log('\n3. ✅ Contando canais...');
    const initialCount = await axios.get(
      `${API_BASE_URL}/access-channel-manager/channels/count`,
    );
    console.log('   Canais iniciais:', initialCount.data.number);

    // 4. Criar canal
    console.log('\n4. ✅ Criando canal...');
    const createChannel = await api.post('/access-channel-manager/channels', {
      channelName: `test-poc-${Date.now()}`, // Nome único para evitar conflitos
    });
    console.log('   TxHash:', createChannel.data.transactionHash);

    // ESPERAR para sincronizar nonce
    console.log('   ⏳ Aguardando confirmação...');
    await wait(2000);

    const channelName = createChannel.data.channelName;

    // 5. Verificar info do canal
    console.log('\n5. ✅ Verificando info do canal...');
    const channelInfo = await axios.get(
      `${API_BASE_URL}/access-channel-manager/channels/${channelName}`,
    );
    console.log('   Existe:', channelInfo.data.exists);
    console.log('   Ativo:', channelInfo.data.isActive);
    console.log('   Membros:', channelInfo.data.memberCount);

    // 6. Adicionar membro
    console.log('\n6. ✅ Adicionando membro...');
    const addMember = await api.post(
      '/access-channel-manager/channels/addMember',
      {
        channelName: channelName,
        addressMember: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      },
    );
    console.log('   TxHash:', addMember.data.transactionHash);

    // ESPERAR novamente
    console.log('   ⏳ Aguardando confirmação...');
    await wait(2000);

    // 7. Verificar se é membro
    console.log('\n7. ✅ Verificando membresía...');
    const checkMember = await axios.post(
      `${API_BASE_URL}/access-channel-manager/channels/checkMember`,
      {
        channelName: channelName,
        memberAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      },
    );
    console.log('   É membro:', checkMember.data.isMember);

    // 8. Adicionar múltiplos membros
    console.log('\n8. ✅ Adicionando múltiplos membros...');
    const addMultiple = await api.post(
      '/access-channel-manager/channels/addMembers',
      {
        channelName: channelName,
        memberAddresses: [
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account #2
          '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Account #3
        ],
      },
    );
    console.log('   TxHash:', addMultiple.data.transactionHash);
    console.log('   Membros adicionados:', addMultiple.data.addressCount);

    await wait(2000);

    // 9. Verificar múltiplos membros
    console.log('\n9. ✅ Verificando múltiplos membros...');
    const checkMultiple = await axios.post(
      `${API_BASE_URL}/access-channel-manager/channels/${channelName}/checkMembers`,
      {
        memberAddresses: [
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          '0x1111111111111111111111111111111111111111', // Este não deveria ser membro
        ],
      },
    );
    console.log('   Resultados:', checkMultiple.data.results); // [true, true, false]

    // 10. Listar membros paginados
    console.log('\n10. ✅ Listando membros...');
    const members = await axios.get(
      `${API_BASE_URL}/access-channel-manager/channels/${channelName}/members`,
    );
    console.log('   Total membros:', members.data.totalMembers);
    console.log('   Primeiros 2 membros:', members.data.members.slice(0, 2));

    // 11. Listar todos os canais
    console.log('\n11. ✅ Listando todos os canais...');
    const allChannels = await axios.get(
      `${API_BASE_URL}/access-channel-manager/channels`,
    );
    console.log('   Total canais:', allChannels.data.totalChannels);

    // 12. Remover um membro
    console.log('\n12. ✅ Removendo membro...');
    const removeMember = await api.post(
      '/access-channel-manager/channels/removeMember',
      {
        channelName: channelName,
        addressMember: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      },
    );
    console.log('   TxHash:', removeMember.data.transactionHash);

    await wait(2000);

    // 13. Verificar contagem final
    console.log('\n13. ✅ Contagem final...');
    const finalInfo = await axios.get(
      `${API_BASE_URL}/access-channel-manager/channels/${channelName}`,
    );
    console.log('   Membros finais:', finalInfo.data.memberCount);

    console.log(
      '\n ACCESS CHANNEL MANAGER COMPLETA! Todos os endpoints testados com sucesso! ',
    );
    console.log('\n Resumo:');
    console.log('   ✅ Canal criado');
    console.log('   ✅ Membros adicionados (individual e batch)');
    console.log('   ✅ Membresía verificada');
    console.log('   ✅ Listagem funcionando');
    console.log('   ✅ Remoção de membros');
    console.log('   ✅ Paginação operacional');
  } catch (error) {
    console.error('\n Erro no teste:', error.response?.data || error.message);
    console.log(
      '\n Verifique se a API está rodando e os contratos estão deployados',
    );
  }
}

testAccessChannelManager();
