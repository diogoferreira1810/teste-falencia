// Importações
import { Router } from 'express';
import pool, { testConnection } from '../db.js';  // Importa a função testConnection

// Cria um ROUTER (um objeto que organiza as rotas/endpoints)
// Router = um "mapa de caminhos" que o servidor pode seguir
const router = Router();

// SET de valores de "placeholder" (valores de teste)
// Usados para verificar se o utilizador ainda tem variáveis por configurar
const placeholderValues = new Set(['localhost', 'nome_da_bd', 'utilizador', 'password', '']);

// ============ ROTA 1: GET /connection-status ============
// O que faz: Testa a conexão à BD e retorna o resultado
// async = espera pela resposta da BD antes de enviar resposta
router.get('/connection-status', async (_req, res) => {
  // _req = pedido (ignoramos o conteúdo do pedido, por isso _)
  // res = objeto para enviar a resposta
  
  // Chama a função testConnection() que envia "SELECT 1" à BD
  const connectionTest = await testConnection();
  
  // ENVIA a resposta para o frontend em JSON
  res.json({
    ok: connectionTest.success,        // true se conectado, false se erro
    message: connectionTest.message,   // Mensagem (✅ sucesso ou ❌ erro)
  });
});

// ============ ROTA 2: GET /dados ============
// O que faz: Busca dados da BD e retorna
router.get('/dados', async (_req, res) => {
  // VERIFICA se ainda há variáveis de configuração por preencher (placeholders)
  // Procura se alguma das variáveis (DB_HOST, DB_NAME, etc) tem um valor de teste
  const hasPlaceholderConfig =
    placeholderValues.has(process.env.DB_HOST ?? '') ||        // Se DB_HOST é 'localhost'
    placeholderValues.has(process.env.DB_NAME ?? '') ||        // Se DB_NAME é 'nome_da_bd'
    placeholderValues.has(process.env.DB_USER ?? '') ||        // Se DB_USER é 'utilizador'
    placeholderValues.has(process.env.DB_PASSWORD ?? '');      // Se DB_PASSWORD é 'password'

  // Se ainda há variáveis não configuradas
  if (hasPlaceholderConfig) {
    res.json({
      ok: false,
      data: [],
    });

    return;  // Para aqui e não tenta conectar à BD
  }

  // Tenta buscar dados da BD
  try {
    // Envia uma pergunta à BD: "SELECT 1" = teste simples
    const result = await pool.query('SELECT 1 AS ok');
    
    // Se conseguiu, envia resposta com sucesso
    res.json({
      ok: true,
      data: result.rows,  // Envia as linhas retornadas pela BD
    });
  } catch (error) {
    // Se der erro (BD offline, sem permissões, etc)
    console.error(error);  // Mostra o erro na consola do servidor
    
    // Envia resposta de erro com status 503 (serviço indisponível)
    res.status(503).json({
      ok: false,
      message: 'A base de dados ainda não está disponível',
      data: [],
    });
  }
});

// Exporta o router para que o server.ts possa usar
export default router;