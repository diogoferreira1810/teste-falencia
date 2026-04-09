import { useEffect, useState } from 'react';
import { getDados } from '../services/api';

const Home = () => {
  const [dados, setDados] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);

  useEffect(() => {
    // Verificar status da conexão
    fetch('http://localhost:3001/api/connection-status')
      .then((res) => res.json())
      .then((data) => setConnectionStatus(data))
      .catch((err) => setConnectionStatus({ ok: false, message: 'Erro ao verificar conexão: ' + err.message }))
      .finally(() => setConnectionLoading(false));

    // Buscar dados
    getDados()
      .then((data) => setDados(data))
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : 'Erro ao buscar dados');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Home</h1>
      
      {/* Status da Conexão */}
      <div style={{ padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Status da Conexão</h2>
        {connectionLoading && <p>A verificar conexão...</p>}
        {!connectionLoading && connectionStatus && (
          <p style={{ color: connectionStatus.ok ? 'green' : 'red', fontWeight: 'bold' }}>
            {connectionStatus.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;
