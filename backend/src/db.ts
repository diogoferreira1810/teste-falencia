// Pool é um "gestor de conexões" - permite reutilizar conexões
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Cria um POOL de conexões à base de dados
// Pool = um grupo de "linhas telefónicas" prontas para usar
const pool = new Pool({
  // Dados para contactar a BD (como o número de telefone)
  host: process.env.DB_HOST,           // IP do computador onde está a BD (158.178.198.153)
  port: Number(process.env.DB_PORT) || 5432,  // Porta que a BD usa (5432 é padrão PostgreSQL)
  database: process.env.DB_NAME,       // Nome da base de dados
  user: process.env.DB_USER,           // Utilizador para autenticação (postgres)
  password: process.env.DB_PASSWORD,   // Senha para autenticação
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined  // Segurança
});

// Função para TESTAR se a conexão está a funcionar
// Retorna um objeto com: sucesso (true/false) e uma mensagem
export async function testConnection() {
  try {
    // Envia uma pergunta simples à BD: "SELECT 1" = "Estás lá?"
    // A BD responde com o número 1 se conseguir receber a pergunta
    const result = await pool.query('SELECT 1 AS ok');
    
    // Se chegou aqui, a BD respondeu = conexão bem-sucedida!
    return { 
      success: true, 
      message: '✅ Conectado à base de dados com sucesso' 
    };
  } catch (error) {
    // Se der erro, a BD não respondeu (senha errada, computador offline, etc)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      message: `❌ Erro na conexão: ${errorMessage}` 
    };
  }
}

// Exporta o pool para que outros ficheiros possam usar
export default pool;