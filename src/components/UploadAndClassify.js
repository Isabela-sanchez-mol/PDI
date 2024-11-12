import React, { useState, useRef, useEffect } from 'react';
import * as ort from 'onnxruntime-web';
import "../styles/ImageUpload.css";
import buziracoAudio from '../assets/buziraco.mp3';
import candilejaAudio from '../assets/candileja.mp3';


const UploadAndClassify = () => {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null); // State for storing processed image
  const [prediction, setPrediction] = useState(null);
  const [audioSource, setAudioSource] = useState(null); // Store the audio source to dynamically change it
  const imageInputRef = useRef(null); // Ref for the file input
  const audioRef = useRef(null);

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
        // Create the ONNX model session for style transfer
        const session = await ort.InferenceSession.create('modelo_cnn.onnx');
        const tensor = preprocessImage(img);
        const feeds = { input: tensor };
        const results = await session.run(feeds);
        const output = results.output.data;

        // Determine prediction based on output
        if (output[0] > output[1]) {
          setPrediction('Buziraco');
          setAudioSource(buziracoAudio);
        } else {
          setPrediction('Candileja');
          setAudioSource(candilejaAudio);
        }

        // Process style transfer and update processed image
        const styledImage = await applyStyleTransfer(img); // Call your style transfer function
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

  // Apply style transfer to the image (this should be an async function)
  const applyStyleTransfer = async (image) => {
    // Implement the style transfer logic here. This could be a call to a model or some other function
    // For example, you could use a pre-trained model for style transfer:
    
    // Returning a mock image URL for demonstration purposes
    return image.src;  // Replace this with the actual processed image from the style transfer
  };

  useEffect(() => {
    if (audioSource && audioRef.current) {
      audioRef.current.load();  // Reload the audio when the source changes
    }
  }, [audioSource]);

  // Function to remove the image and reset the input
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
            <button onClick={removeImage} className="remove-image-btn">x</button>
          </>
        )}
        {processedImage && (
          <img src={processedImage} alt="Imagen procesada" style={{ width: '224px', height: '224px', marginLeft: '20px' }} />
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
