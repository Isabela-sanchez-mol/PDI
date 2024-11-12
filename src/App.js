import React from 'react';
import UploadAndClassify from './components/UploadAndClassify';
import './styles/App.css';  // Importa tus estilos si tienes

const App = () => {
  return (
    <div className="App">
      <h1>Conexión Cultural: <br />Historias a través del Arte</h1>
      <p>Haz tu dibujo, súbelo y descubre su historia</p>
      <div className="bubble-left">
        <img className="bubble-image" src="../src/assets/candileja_ej.jpg" alt="La Candileja"/>
        <h3>La Candileja</h3>
      </div>
      <div className="bubble-right">
      <img className="bubble-image" src="/src/assets/buziraco_ej.jpg" alt="Buziraco" />
      <h3>Buziraco</h3>
      </div>
      <UploadAndClassify />
    </div>
  );
};

export default App;
