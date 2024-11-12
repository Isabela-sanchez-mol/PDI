import React from 'react';
import './styles/App.css';  // Asegúrate de tener la importación del CSS
import UploadAndClassify from './components/UploadAndClassify'; // Importa tu componente

const App = () => {
  return (
    <div className="App">
      <h1>Conexión Cultural: <br />Historias a través del Arte</h1>
      <p>Haz tu dibujo, súbelo y descubre su historia</p>
      
      <div className="bubbles-container">
        <div className="bubble-left">
          <h3>Buziraco</h3>
        </div>
        
        <div className="upload-container">
          <UploadAndClassify/>
        </div>

        <div className="bubble-right">
          <h3>La Candileja</h3>
        </div>
      </div>
    </div>
  );
};

export default App;
