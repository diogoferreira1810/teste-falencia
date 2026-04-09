// Importações: bibliotecas que precisamos
import cors from 'cors';                           // Permite que o frontend comunique com servidor
import dotenv from 'dotenv';                       // Lê variáveis do ficheiro .env
import express from 'express';                     // Framework para criar o servidor web
import exemploRoutes from './routes/exemplo.js';  // Importa as rotas (endpoints)

// Carrega as variáveis do ficheiro .env (DB_HOST, DB_PASSWORD, etc)
dotenv.config();

// Cria uma APLICAÇÃO EXPRESS
// Express = biblioteca que facilita criar um servidor web
const app = express();

// MIDDLEWARE: Configurações que executam ANTES de processar cada pedido

// 1. CORS: Permite que um frontend em localhost:5173 comunique com este servidor
//    Sem isto, o frontend seria bloqueado por "segurança cross-origin"
app.use(cors({ origin: 'http://localhost:5173' }));

// 2. JSON: Permite que o servidor RECEBA e ENVIE dados em formato JSON
//    Exemplo: { ok: true, message: 'Conectado' }
app.use(express.json());

// ROTAS: Define os "caminhos" que o frontend pode chamar
// /api = prefixo base
// Se o frontend chamar /api/connection-status, vai para exemploRoutes
app.use('/api', exemploRoutes);

// Define a porta onde o servidor vai estar à escuta
const PORT = Number(process.env.PORT) || 3001;  // Usa a var PORT do .env ou 3001 por defeito

// INICIA o servidor na porta definida
app.listen(PORT, () => {
  // Quando o servidor inicia, mostra esta mensagem na consola
  console.log(`API a correr em http://localhost:${PORT}`);
});