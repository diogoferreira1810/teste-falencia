import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  return (
    <>
      <div className='flex flex-col items-center justify-center min-h-screen text-white'>
      <div>
          <h1 className='text-left text-md mb-4'>Tecnologias importantes para o site</h1>
          <p>vou fazer uma listagem (kinda) de tecnologias que é importante usarmos no site e também para leres, informares-te e depois testar/inventar para te familiarizares.</p>
        </div> 
        <div className='p-8 mt-2 mb-2 border rounded-lg bg-gray-800 w-full'>
          <h2 className='text-left text-2xl font-bold'>React-Router</h2>
          <p className='text-left'>React usa a lógica de componentes no seu development, facilitando a criação de interfaces dinâmicas. Quando se clica num link, não está a abrir uma pagina nova, mas sim a renderizar um novo componente. React-router é usado para definir as rotas e a navegação entre esses componentes.</p>
        </div>
        <div className='p-8 mt-2 mb-2 border rounded-lg bg-gray-800 w-full'>
          <h2 className='text-left text-2xl font-bold'>Tailwind</h2>
          <p className='text-left'>Biblioteca de CSS, usada para estilização mais rápida em vez de escrever CSS tradicional. Usas classes ja definidas que podes combinar para customizar</p>
        </div>
        <div className='p-8 mt-2 mb-2 border rounded-lg bg-gray-800 w-full'>
          <h2 className='text-left text-2xl font-bold'>Stlyed Components</h2>
          <p className='text-left'>Aqui usas para criar componentes com um estilo ja predefinido. Exemplo - crias um botão base e sempre que precisares de um botão ele já vem com o estilo que tu queres, em vez de teres que meter as classes. Usado em conjunto com tailwind acelera-te imenso o desenvolvimento de um site, quase que é juntar peças para formar o todo</p>
        </div>
                <p>
          Edit no app.tsx
        </p>
      </div>
    </>
  )
}

export default App
