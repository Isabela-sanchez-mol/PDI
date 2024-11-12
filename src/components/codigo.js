import React, { useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const StyleTransfer = ({ onImageProcessed }) => {
    const [contentImage, setContentImage] = useState(null);

    const loadImage = async (imageSrc) => {
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve) => (img.onload = resolve));
        return img;
    };

    const processImage = async (file) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => (img.onload = resolve));

        const tensor = tf.browser
            .fromPixels(img)
            .resizeBilinear([256, 256])
            .toFloat()
            .div(tf.scalar(255))
            .expandDims();
        return tensor;
    };

    const applyStyleTransfer = async (prediction) => {
        const contentTensor = await processImage(contentImage);

        let styleTensor;
        if (prediction === 'candileja') {
            const styleImg = await loadImage('..//candileja_style.jpg');
            styleTensor = await processImage(styleImg);
        } else if (prediction === 'buziraco') {
            const styleImg = await loadImage('..//buziraco_style.jpg');
            styleTensor = await processImage(styleImg);
        } else {
            alert('Predicción no válida');
            return;
        }

        if (contentTensor && styleTensor) {
            const model = await tf.loadGraphModel('model_url');
            const output = await model.executeAsync({
                'Placeholder': contentTensor,
                'Placeholder_1': styleTensor
            });

            const stylizedImageTensor = output[0].squeeze();
            const canvas = document.getElementById('outputCanvas');
            await tf.browser.toPixels(stylizedImageTensor, canvas);

            // Pasar la imagen al componente padre (onImageProcessed)
            if (onImageProcessed) {
                const imageDataUrl = canvas.toDataURL();  // Convertir el canvas a una URL de imagen
                onImageProcessed(imageDataUrl);  // Llamar a la función del padre con la imagen procesada
            }

            tf.dispose([stylizedImageTensor, output, contentTensor, styleTensor]);
        } else {
            alert('Asegúrate de que las imágenes de contenido y estilo estén listas.');
        }
    };

    return (
        <div>
            <h1>Transferencia de Estilo</h1>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setContentImage(e.target.files[0])}
            />
            <p>Sube una imagen de contenido</p>

            <button onClick={() => applyStyleTransfer('candileja')}>Aplicar Estilo de Candileja</button>
            <button onClick={() => applyStyleTransfer('buziraco')}>Aplicar Estilo de Buziraco</button>

            <canvas id="outputCanvas" width="256" height="256"></canvas>
        </div>
    );
};

export default StyleTransfer;
