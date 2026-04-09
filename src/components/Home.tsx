import { useEffect, useState } from 'react';
import { getDados } from '../services/api';

const Home = () => {
  const [dados, setDados] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
      <p>Dados vindos da API:</p>
      {loading && <p>A carregar...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && <pre>{JSON.stringify(dados, null, 2)}</pre>}
    </div>
  );
};

export default Home;
