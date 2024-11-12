import React, { useState, useRef, useEffect } from 'react';
import * as ort from 'onnxruntime-web';
import * as tf from '@tensorflow/tfjs'; // Importar TensorFlow.js para la GAN
import '../styles/ImageUpload.css';
import buziracoAudio from '../assets/buziraco.mp3';
import candilejaAudio from '../assets/candileja.mp3';

const UploadAndClassify = () => {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null); // State for storing processed image
  const [prediction, setPrediction] = useState(null);
  const [audioSource, setAudioSource] = useState(null); // Store the audio source to dynamically change it
  const imageInputRef = useRef(null); // Ref for the file input
  const audioRef = useRef(null);
  const [styleModel, setStyleModel] = useState(null); // State to store the loaded style model

  useEffect(() => {
    const loadStyleModel = async () => {
      try {
        const model = await tf.loadGraphModel('tfjs_model/arbitrary_image_stylization/model.json');
        setStyleModel(model);
        console.log('Modelo de estilo cargado exitosamente');

        // Inspecciona los nombres de las entradas del modelo
        console.log(
          'Entradas del modelo:',
          model.inputs.map((input) => input.name)
        );
        console.log(
          'Salidas del modelo:',
          model.outputs.map((output) => output.name)
        );
      } catch (error) {
        console.error('Error cargando el modelo de estilo:', error);
      }
    };
    loadStyleModel();
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setPrediction(null); // Reset prediction for new image
        setAudioSource(null); // Reset audio source when a new image is selected
        setProcessedImage(null); // Reset processed image
      };
      reader.readAsDataURL(file);
    }
  };

  const classifyImage = async () => {
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = async () => {
        // Crear la sesión del modelo ONNX para la clasificación
        const session = await ort.InferenceSession.create('modelo_cnn.onnx');
        const tensor = preprocessImage(img);
        const feeds = { input: tensor };
        const results = await session.run(feeds);
        const output = results.output.data;

        // Determinar la predicción basada en el resultado
        if (output[0] > output[1]) {
          setPrediction('Buziraco');
          setAudioSource(buziracoAudio);
        } else {
          setPrediction('Candileja');
          setAudioSource(candilejaAudio);
        }

        // Aplicar transferencia de estilo y actualizar la imagen procesada
        const styledImage = await applyStyleTransfer(img, output); // Llamada a la función de transferencia de estilo
        setProcessedImage(styledImage);
      };
    }
  };

  const preprocessImage = (image) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 28;
    const height = 28;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const grayData = new Float32Array(width * height);

    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      grayData[i] = (r + g + b) / 3 / 255.0;
    }

    return new ort.Tensor('float32', grayData, [1, 1, width, height]);
  };

  const applyStyleTransfer = async (image, output) => {
    if (!styleModel) {
      console.error('Modelo de estilo no cargado');
      return image.src;
    }
    console.log('Aplicando transferencia de estilo...');

    // Procesar la imagen de contenido
    const contentTensor = tf.browser
      .fromPixels(image)
      .resizeBilinear([256, 256])
      .toFloat()
      .div(tf.scalar(255))
      .expandDims();
    console.log('Tensor de contenido creado:', contentTensor);

    // Seleccionar la imagen de estilo
    let styleImageUrl;
    if (output[0] < output[1]) {
      styleImageUrl = 'candileja_style.jpg';
    } else if (output[0] > output[1]) {
      styleImageUrl = 'buziraco_style.jpg';
    } else {
      alert('Predicción no válida');
      return;
    }
    console.log('Ruta de la imagen de estilo:', styleImageUrl);

    // Cargar y procesar la imagen de estilo
    const styleTensor = await loadImageFromUrl(styleImageUrl);
    console.log('Tensor de estilo cargado:', styleTensor);

    // Ejecutar el modelo de estilo con los nombres de entrada correctos
    const result = await styleModel.executeAsync({
      content_image: contentTensor,
      style_image: styleTensor,
    });

    // Elimina la primera dimensión para que el tensor tenga rango 3
    const stylizedImageTensor = result.squeeze([0]);
    console.log('Tensor de imagen estilizada (rango 3):', stylizedImageTensor);

    // Renderizar la imagen estilizada en un canvas y convertirla en URL
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    await tf.browser.toPixels(stylizedImageTensor, canvas);
    const imageDataUrl = canvas.toDataURL(); // Convertir el canvas a URL de imagen

    // Liberar memoria
    tf.dispose([stylizedImageTensor, contentTensor, styleTensor]);

    console.log('Imagen procesada URL:', imageDataUrl);

    return imageDataUrl;
  };

  // Función auxiliar para cargar la imagen de estilo desde una URL y procesarla
  const loadImageFromUrl = async (url) => {
    const img = new Image();
    img.src = url;
    await new Promise((resolve) => (img.onload = resolve));
    return tf.browser.fromPixels(img).resizeBilinear([256, 256]).toFloat().div(tf.scalar(255)).expandDims();
  };

  useEffect(() => {
    if (audioSource && audioRef.current) {
      audioRef.current.load(); // Reload the audio when the source changes
    }
  }, [audioSource]);

  // Función para remover la imagen y resetear la entrada
  const removeImage = () => {
    setImage(null);
    setProcessedImage(null);
    setPrediction(null);
    setAudioSource(null);
    imageInputRef.current.value = ''; // Reset the file input value
  };

  return (
    <div className="upload-container">
      <div className="btn-container">
        <button
          onClick={() => imageInputRef.current.click()} // Open file dialog on button click
          className="btn-content"
        >
          Subir Imagen
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }} // Hide the file input
        />
      </div>

      <div className="image-container">
        {image && (
          <>
            <img src={image} alt="Imagen seleccionada" style={{ width: '224px', height: '224px' }} />
            <button onClick={removeImage} className="remove-image-btn">
              x
            </button>
          </>
        )}
        {processedImage && (
          <img
            src={processedImage}
            alt="Imagen procesada"
            style={{ width: '224px', height: '224px', marginLeft: '20px' }}
          />
        )}
      </div>

      <button onClick={classifyImage} className="btn-content">
        Procesar
      </button>

      {prediction && (
        <div className="prediction">
          <h3>Predicción: {prediction}</h3>
        </div>
      )}

      {audioSource && (
        <div className="audio-player">
          <audio ref={audioRef} src={audioSource} controls />
        </div>
      )}
    </div>
  );
};

export default UploadAndClassify;
