import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Monitor, RefreshCw, Square, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const log = (msg: string) => console.log(`[Recorder] ${msg}`);

export default function Recorder() {
    const navigate = useNavigate();
    const [isRecording, setIsRecording] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [debugInfo, setDebugInfo] = useState('Ready');
    const [webcamEnabled, setWebcamEnabled] = useState(false);
    const [webcamReady, setWebcamReady] = useState(false);

    // Initial position for the bubble (bottom-right)
    const [bubblePos, setBubblePos] = useState({ x: 80, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const webcamVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chunksRef = useRef<Blob[]>([]);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null);
    const blobRef = useRef<Blob | null>(null);
    const animFrameRef = useRef<number>(0);
    const screenVideoRef = useRef<HTMLVideoElement | null>(null);

    // To keep track of current position in animation loop without stale closure
    const bubblePosRef = useRef({ x: 0.8, y: 0.8 });

    // Initialize webcam on mount
    useEffect(() => {
        let cancelled = false;
        if (webcamEnabled) {
            navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            })
                .then(stream => {
                    if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                    webcamStreamRef.current = stream;
                    if (webcamVideoRef.current) {
                        webcamVideoRef.current.srcObject = stream;
                    }
                    setWebcamReady(true);
                    log('Webcam ready');
                })
                .catch(() => {
                    if (!cancelled) {
                        log('Webcam not available');
                        setWebcamEnabled(false);
                    }
                });
        }
        return () => {
            cancelled = true;
            webcamStreamRef.current?.getTracks().forEach(t => t.stop());
            webcamStreamRef.current = null;
        };
    }, []);

    const toggleWebcam = () => {
        if (webcamEnabled && webcamStreamRef.current) {
            webcamStreamRef.current.getTracks().forEach(t => t.stop());
            webcamStreamRef.current = null;
            if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
            setWebcamReady(false);
            setWebcamEnabled(false);
            log('Webcam disabled');
        } else {
            navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            })
                .then(stream => {
                    webcamStreamRef.current = stream;
                    if (webcamVideoRef.current) {
                        webcamVideoRef.current.srcObject = stream;
                    }
                    setWebcamReady(true);
                    setWebcamEnabled(true);
                    log('Webcam enabled');
                })
                .catch(() => log('Webcam not available'));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStartRef.current) return;

        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        // Calculate new percentage based on container size
        const container = e.currentTarget.getBoundingClientRect();

        setBubblePos(prev => {
            let newX = prev.x + (deltaX / container.width) * 100;
            let newY = prev.y + (deltaY / container.height) * 100;

            // Clamp values
            newX = Math.max(0, Math.min(90, newX));
            newY = Math.max(0, Math.min(85, newY));

            bubblePosRef.current = { x: newX / 100, y: newY / 100 };
            return { x: newX, y: newY };
        });

        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
    };


    const drawCompositeFrame = (
        canvas: HTMLCanvasElement,
        screenVideo: HTMLVideoElement,
        webcamVideo: HTMLVideoElement | null,
        showWebcam: boolean
    ) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

        if (showWebcam && webcamVideo && webcamVideo.readyState >= 2) {
            const bubbleSize = Math.min(canvas.width, canvas.height) * 0.2;

            // Use current ref position
            const pos = bubblePosRef.current;
            const x = canvas.width * pos.x;
            const y = canvas.height * pos.y;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x + bubbleSize / 2, y + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            const vw = webcamVideo.videoWidth;
            const vh = webcamVideo.videoHeight;
            const size = Math.min(vw, vh);
            const sx = (vw - size) / 2;
            const sy = (vh - size) / 2;
            ctx.drawImage(webcamVideo, sx, sy, size, size, x, y, bubbleSize, bubbleSize);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(x + bubbleSize / 2, y + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
            ctx.strokeStyle = '#f97316'; // orange-500
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        animFrameRef.current = requestAnimationFrame(() =>
            drawCompositeFrame(canvas, screenVideo, webcamVideo, showWebcam)
        );
    };

    const cleanupRecording = () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = 0;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        if (screenVideoRef.current) {
            screenVideoRef.current.pause();
            screenVideoRef.current.srcObject = null;
            screenVideoRef.current = null;
        }
        if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = null;
        }
        mediaRecorderRef.current = null;
    };

    const startRecording = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                    frameRate: { ideal: 60 }
                },
                audio: true // System audio
            });

            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            screenStreamRef.current = screenStream;
            const videoTrack = screenStream.getVideoTracks()[0];
            if (!videoTrack) { log('No video track'); return; }

            const settings = videoTrack.getSettings();
            const canvas = canvasRef.current!;
            canvas.width = settings.width || 1920;
            canvas.height = settings.height || 1080;

            const screenVideo = document.createElement('video');
            screenVideo.srcObject = screenStream;
            screenVideo.muted = true;
            screenVideo.playsInline = true;
            await screenVideo.play();
            screenVideoRef.current = screenVideo;

            // Start compositing
            drawCompositeFrame(canvas, screenVideo, webcamVideoRef.current, webcamEnabled && webcamReady);

            const canvasStream = canvas.captureStream(60);

            // Add audio tracks
            screenStream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
            micStream.getAudioTracks().forEach(t => canvasStream.addTrack(t));

            if (previewVideoRef.current) {
                previewVideoRef.current.srcObject = canvasStream;
            }

            let mimeType = '';
            for (const t of ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']) {
                if (MediaRecorder.isTypeSupported(t)) { mimeType = t; break; }
            }
            if (!mimeType) mimeType = 'video/webm';

            log(`Recording: ${mimeType}`);
            const recorder = new MediaRecorder(canvasStream, {
                mimeType,
                videoBitsPerSecond: 8000000
            });
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                cleanupRecording();
                const blob = new Blob(chunksRef.current, { type: mimeType });
                blobRef.current = blob;
                setPreviewUrl(URL.createObjectURL(blob));
            };

            videoTrack.onended = () => {
                if (recorder.state === 'recording') {
                    recorder.requestData();
                    recorder.stop();
                    setIsRecording(false);
                }
            };

            recorder.start(1000);
            log('Recording started!');
            mediaRecorderRef.current = recorder;
            setIsRecording(true);

        } catch (err: any) {
            log(`Error: ${err.message}`);
        }
    };

    const stopRecording = () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state === 'recording') {
            recorder.requestData();
            setTimeout(() => {
                if (recorder.state === 'recording') recorder.stop();
                setIsRecording(false);
            }, 200);
        }
    };

    const uploadRecording = async () => {
        if (!blobRef.current) return;

        try {
            setIsUploading(true);
            setDebugInfo('Uploading to server...');

            const filename = `recording-${Date.now()}.webm`;
            const file = new File([blobRef.current], filename, { type: blobRef.current.type });

            // 1. Upload to backend (which uploads to Wistia)
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';
            const response = await fetch(`${API_URL}/uploads/${filename}`, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            log('Upload successful: ' + JSON.stringify(data));

            // 2. Redirect to video player with custom slug or Wistia ID
            if (data.customSlug) {
                navigate(`/aum/${data.customSlug}`);
            } else if (data.hashed_id) {
                navigate(`/video/${data.hashed_id}`);
            } else {
                alert('Upload successful but no video ID returned.');
            }

        } catch (error: any) {
            console.error('Upload error:', error);
            setDebugInfo(`Upload Error: ${error.message}`);
            alert(`Failed to upload: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <video
                ref={webcamVideoRef}
                autoPlay
                playsInline
                muted
                style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            />

            <div
                className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden aspect-video shadow-2xl cursor-default"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {!previewUrl ? (
                    <video
                        ref={previewVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <video src={previewUrl} controls autoPlay className="w-full h-full" />
                )}

                {/* Webcam bubble (visible overlay) */}
                {webcamEnabled && webcamReady && !previewUrl && (
                    <div
                        className="absolute w-32 h-32 rounded-full overflow-hidden border-4 border-orange-500 shadow-lg bg-gray-900 cursor-move hover:border-orange-400 transition-colors"
                        style={{
                            left: `${bubblePos.x}%`,
                            top: `${bubblePos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 50
                        }}
                        onMouseDown={handleMouseDown}
                    >
                        <video
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover pointer-events-none"
                            ref={(el) => {
                                if (el && webcamStreamRef.current) {
                                    el.srcObject = webcamStreamRef.current;
                                }
                            }}
                        />
                    </div>
                )}

                {!isRecording && !previewUrl && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50 pointer-events-none">
                        <p>Click "Start Recording" to begin</p>
                    </div>
                )}

                {/* Upload Progress Overlay */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 rounded-xl backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                        <p className="text-white text-lg font-medium">Uploading your recording...</p>
                        <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
                    </div>
                )}
            </div>

            <div className="w-full max-w-4xl bg-gray-800 text-green-400 text-xs font-mono px-4 py-2 rounded">
                DEBUG: {debugInfo}
            </div>

            <div className="flex space-x-4 items-center">
                {!isRecording && !previewUrl && (
                    <button
                        onClick={toggleWebcam}
                        className={`flex items-center px-4 py-3 rounded-full font-semibold shadow-lg transition-all ${webcamEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}
                    >
                        {webcamEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                    </button>
                )}

                {!isRecording && !previewUrl && (
                    <button
                        onClick={startRecording}
                        className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg"
                    >
                        <Monitor className="w-5 h-5 mr-2" /> Start Recording
                    </button>
                )}

                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="flex items-center px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg animate-pulse"
                    >
                        <Square className="w-5 h-5 mr-2" /> Stop Recording
                    </button>
                )}

                {previewUrl && !isRecording && (
                    <div className="flex space-x-4">
                        <button
                            onClick={() => {
                                setPreviewUrl(null);
                                chunksRef.current = [];
                                blobRef.current = null;
                            }}
                            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 mr-2 inline" />
                            Discard
                        </button>
                        <button
                            onClick={uploadRecording}
                            disabled={isUploading}
                            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-5 h-5 mr-2" />
                            {isUploading ? 'Uploading...' : 'Save & Share'}
                        </button>
                        <a
                            href={previewUrl}
                            download={`recording-${Date.now()}.webm`}
                            className="px-6 py-3 border border-indigo-600 text-indigo-400 rounded-lg hover:bg-indigo-900/30 transition-colors flex items-center"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Download
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
