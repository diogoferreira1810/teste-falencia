// Importações React
import { useEffect, useState } from 'react';  // Hooks do React para estado e efeitos
import { getDados } from '../services/api';  // Função para buscar dados da API

// Componente React: Home (este é o que você vê na página)
const Home = () => {
  // ============ ESTADO (variáveis que podem mudar e atualizar a página) ============
  
  // Para armazenar os dados da BD
  const [dados, setDados] = useState<unknown[]>([]);
  // Para controlar se os dados estão a carregar (true enquanto não tem resposta)
  const [loading, setLoading] = useState(true);
  // Para armazenar mensagens de erro
  const [error, setError] = useState('');
  
  // Para armazenar o STATUS da conexão (resultado do testConnection)
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);
  // Para controlar se está a verificar a conexão
  const [connectionLoading, setConnectionLoading] = useState(true);

  // ============ EFEITO: Executa quando a página carrega ============
  // useEffect: tem um tempo especial para correr (quando a página aparece)
  useEffect(() => {
    // ======================== PARTE 1: Testar conexão ========================
    // Faz um pedido HTTP GET para /api/connection-status
    fetch('http://localhost:3001/api/connection-status')
      // .then: Se conseguir contactar o servidor
      .then((res) => res.json())  // Converte a resposta em JSON (texto → objeto)
      // .then: Quando tem os dados
      .then((data) => setConnectionStatus(data))  // Guarda no estado (atualiza a página)
      // .catch: Se der erro (servidor não responde, etc)
      .catch((err) => setConnectionStatus({ ok: false, message: 'Erro ao verificar conexão: ' + err.message }))
      // .finally: Executa SEMPRE no fim (com ou sem erro)
      .finally(() => setConnectionLoading(false));  // Deixa de estar "a carregar"

    // ======================== PARTE 2: Buscar dados ========================
    // Chama a função getDados() do ficheiro api.ts
    getDados()
      // Se conseguir
      .then((data) => setDados(data))  // Guarda os dados no estado
      // Se der erro
      .catch((fetchError) => {
        const msg = fetchError instanceof Error ? fetchError.message : 'Erro ao buscar dados';
        setError(msg);  // Guarda a mensagem de erro
      })
      // No fim (com ou sem erro)
      .finally(() => setLoading(false));  // Deixa de estar "a carregar"
  }, []);  // [] = executa só uma vez quando a página carrega

  // ============ RETORNA o HTML que será mostrado ============
  return (
    <div>
      <h1>Home</h1>
      
      {/* ======== SECÇÃO 1: Status da Conexão ======== */}
      <div style={{ padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Status da Conexão</h2>
        
        {/* Enquanto está a verificar */}
        {connectionLoading && <p>A verificar conexão...</p>}
        
        {/* Quando terminou de verificar */}
        {!connectionLoading && connectionStatus && (
          // Mostra em VERDE se ok (true) ou VERMELHO se erro (false)
          <p style={{ color: connectionStatus.ok ? 'green' : 'red', fontWeight: 'bold' }}>
            {connectionStatus.message}  {/* Mostra a mensagem do servidor */}
          </p>
        )}
      </div>

      {/* ======== SECÇÃO 2: Dados da BD ======== */}
      <p>Dados vindos da API:</p>
      
      
      {/* Se houve erro */}
      {error && <p>{error}</p>}
      
      {/* Se tem dados (não está a carregar e não há erro) */}
      {!loading && !error && <pre>{JSON.stringify(dados, null, 2)}</pre>}
    </div>
  );
};

export default Home;
