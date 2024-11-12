import React from 'react';
import UploadAndClassify from './components/UploadAndClassify';
import './styles/App.css';  // Importa tus estilos si tienes

const App = () => {
  return (
    <div className="App">
      <h1>Conexión Cultural: <br></br>Historias a través del Arte</h1>
      <p>Haz tu dibujo, súbelo y descubre su historia</p>
      <UploadAndClassify />
    </div>
  );
};

export default App;
