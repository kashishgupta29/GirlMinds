import React, { useRef, useState, useEffect } from 'react';

function CameraCapture({ isCapturing, setIsCapturing }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturedImages, setCapturedImages] = useState([]);

    useEffect(() => {
        let stream = null;
        let intervalId = null;

        const setupCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing the camera:", err);
            }
        };

        const captureImage = () => {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/png');
            setCapturedImages((prev) => [...prev, imageData]);
        };

        if (isCapturing && capturedImages.length < 5) {
            setupCamera();
            intervalId = setInterval(() => {
                if (capturedImages.length < 5) {
                    captureImage();
                } else {
                    clearInterval(intervalId);
                    setIsCapturing(false);
                }
            }, 4000); // Capture every 4 seconds
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isCapturing, capturedImages.length, setIsCapturing]);

    useEffect(() => {
        if (capturedImages.length === 5) {
            downloadImages();
        }
    }, [capturedImages]);

    const startCapture = () => {
        setCapturedImages([]);
        setIsCapturing(true);
    };

    const downloadImages = () => {
        capturedImages.forEach((imageDataUrl, index) => {
            const link = document.createElement('a');
            link.href = imageDataUrl;
            link.download = `captured_image_${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    return (
        <div className="container mx-auto p- max-w-lg">
            <h1 className="text-2xl font-bold mb-4">Camera Capture</h1>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto mb-4" />
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />
            <button
                onClick={startCapture}
                disabled={isCapturing}
                className="w-full bg-blue-500 text-white py-2 rounded"
            >
                {capturedImages.length === 5
                    ? 'Images Captured Successfully'
                    : isCapturing
                    ? 'Capturing...'
                    : 'Start Capture'}
            </button>
            <p className="text-center mt-2">
                {isCapturing
                    ? `Capturing: ${capturedImages.length}/5 images`
                    : capturedImages.length === 5
                    ? 'Capture complete. Images downloaded.'
                    : 'Press start to begin capture.'}
            </p>
        </div>
    );
}

export default CameraCapture;
