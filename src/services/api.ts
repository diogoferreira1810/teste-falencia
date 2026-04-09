const BASE_URL = 'http://localhost:3001/api';

export async function getDados() {
  const response = await fetch(`${BASE_URL}/dados`);

  if (!response.ok) {
    throw new Error('Erro ao buscar dados');
  }

  return response.json();
}