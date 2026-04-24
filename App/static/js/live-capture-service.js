// Live Capture Service - Real-Time Detection
let stream = null;
let videoElement = null;
let canvasElement = null;
let animationId = null;
let isDetecting = false;
let lastDetectionTime = 0;
const detectionInterval = 500;

export function setupLiveCapture() {
    console.log("Setting up live capture...");
    
    const startBtn = document.getElementById('start-live-btn');
    const cancelBtn = document.getElementById('cancel-live-btn');
    const retakeLiveBtn = document.getElementById('retake-live-btn');
    const liveContainer = document.getElementById('live-container');
    const video = document.getElementById('video');
    
    videoElement = video;
    canvasElement = document.createElement('canvas');
    
    // ============================================
    // START CAMERA
    // ============================================
    if (startBtn) {
        startBtn.onclick = async () => {
            console.log("Start live capture clicked");
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoElement) {
                    videoElement.srcObject = stream;
                    await videoElement.play();
                    if (liveContainer) liveContainer.style.display = 'block';
                    
                    // Hide results container initially
                    const liveResultsContainer = document.getElementById('live-results-container');
                    if (liveResultsContainer) liveResultsContainer.style.display = 'none';
                    
                    startRealTimeDetection();
                }
            } catch (err) {
                console.error("Camera error:", err);
                alert("Could not access camera. Please check permissions.");
            }
        };
    }
    
    // ============================================
    // REAL-TIME DETECTION LOOP
    // ============================================
    function startRealTimeDetection() {
        if (animationId) cancelAnimationFrame(animationId);
        
        async function detectFrame() {
            if (!videoElement || videoElement.paused || videoElement.ended) {
                animationId = requestAnimationFrame(detectFrame);
                return;
            }
            
            const now = Date.now();
            
            if (now - lastDetectionTime >= detectionInterval && !isDetecting) {
                lastDetectionTime = now;
                isDetecting = true;
                
                try {
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                    const ctx = canvasElement.getContext('2d');
                    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
                    
                    const imageData = canvasElement.toDataURL('image/jpeg', 0.7);
                    
                    const response = await fetch('/api/detect-acne', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageData })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        updateResults(result);
                    }
                    
                } catch (error) {
                    console.error("Detection error:", error);
                } finally {
                    isDetecting = false;
                }
            }
            
            animationId = requestAnimationFrame(detectFrame);
        }
        
        detectFrame();
    }
    
    // ============================================
    // UPDATE RESULTS
    // ============================================
    function updateResults(result) {
        // Force show hidden containers
        const liveFullFrame = document.getElementById('live-full-frame');
        if (liveFullFrame) {
            liveFullFrame.style.display = 'block';
        }
        
        const liveResultsContainer = document.getElementById('live-results-container');
        if (liveResultsContainer) {
            liveResultsContainer.style.display = 'block';
        }
        
        const mainLiveImage = document.getElementById('main-live-image');
        const liveGrid = document.getElementById('live-grid');
        const severitySummary = document.getElementById('severity-summary');
        const phiAnalysisOutput = document.getElementById('phi-analysis-output');
        const livePhiAnalysis = document.getElementById('live-phi-analysis');
        
        // Annotated image
        if (mainLiveImage && result.annotated_image) {
            mainLiveImage.src = result.annotated_image;
            mainLiveImage.style.display = 'block';
        }
        
        // Severity summary
        if (severitySummary) {
            let severityColor = '#4CAF50';
            if (result.overall_severity === 'Mild') severityColor = '#FF9800';
            else if (result.overall_severity === 'Moderate') severityColor = '#FF5722';
            else if (result.overall_severity === 'Severe') severityColor = '#f44336';
            
            severitySummary.innerHTML = `
                <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; margin-top: 15px;">
                    <strong>📈 Total Acne:</strong> ${result.total_acne || 0}<br>
                    <strong>🏥 Severity:</strong> 
                    <span style="color: ${severityColor}; font-weight: bold;">${result.overall_severity || "Unknown"}</span>
                </div>
            `;
        }
        
        // 3x3 Grid
        if (liveGrid && result.region_images && result.region_images.length > 0) {
            const gridOrder = [
                "forehead", "between-eyes", "nose",
                "left-eye", "right-eye", "mouth",
                "left-cheek", "right-cheek", "chin"
            ];
            
            let gridHtml = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">';
            
            for (const expectedName of gridOrder) {
                const region = result.region_images.find(r => r.name === expectedName);
                if (region) {
                    let severityColor = '#4CAF50';
                    let bgColor = '#e8f5e9';
                    if (region.severity === 'Mild') {
                        severityColor = '#FF9800';
                        bgColor = '#fff3e0';
                    } else if (region.severity === 'Moderate') {
                        severityColor = '#FF5722';
                        bgColor = '#fbe9e7';
                    } else if (region.severity === 'Severe') {
                        severityColor = '#f44336';
                        bgColor = '#ffebee';
                    }
                    
                    gridHtml += `
                        <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; text-align: center; background: white;">
                            <img src="${region.image}" style="width: 100%; height: 120px; object-fit: cover;">
                            <div style="padding: 10px; background: ${bgColor};">
                                <strong>${region.name.replace('-', ' ')}</strong><br>
                                Acne: ${region.acne_count}<br>
                                <span style="color: ${severityColor}; font-weight: bold;">${region.severity}</span>
                            </div>
                        </div>
                    `;
                }
            }
            gridHtml += '</div>';
            liveGrid.innerHTML = gridHtml;
        }
        
        // Text analysis
        if (livePhiAnalysis && phiAnalysisOutput) {
            livePhiAnalysis.style.display = 'block';
            if (!window.lastPhiUpdate || Date.now() - window.lastPhiUpdate > 2000) {
                window.lastPhiUpdate = Date.now();
                updateTextAnalysis(result);
            }
        }
    }
    
    // ============================================
    // TEXT ANALYSIS
    // ============================================
    async function updateTextAnalysis(result) {
        const phiAnalysisOutput = document.getElementById('phi-analysis-output');
        if (!phiAnalysisOutput) return;
        
        try {
            const phiResponse = await fetch('/api/phi3-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    total_acne: result.total_acne,
                    overall_severity: result.overall_severity,
                    region_severity: result.region_severity
                })
            });
            
            const phiResult = await phiResponse.json();
            if (phiResult.success) {
                phiAnalysisOutput.innerHTML = phiResult.analysis.replace(/\n/g, '<br>');
            }
        } catch (error) {
            console.error("Text analysis error:", error);
            phiAnalysisOutput.innerHTML = '<em>Text analysis temporarily unavailable</em>';
        }
    }
    
    // ============================================
    // CANCEL CAMERA
    // ============================================
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            console.log("Cancel clicked");
            if (animationId) cancelAnimationFrame(animationId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            if (liveContainer) liveContainer.style.display = 'none';
            const liveResultsContainer = document.getElementById('live-results-container');
            if (liveResultsContainer) liveResultsContainer.style.display = 'none';
            if (videoElement) videoElement.srcObject = null;
            isDetecting = false;
        };
    }
    
    // ============================================
    // RETAKE BUTTON
    // ============================================
    if (retakeLiveBtn) {
        retakeLiveBtn.onclick = () => {
            console.log("Retake clicked");
            const liveResultsContainer = document.getElementById('live-results-container');
            const severitySummary = document.getElementById('severity-summary');
            const liveGrid = document.getElementById('live-grid');
            const mainLiveImage = document.getElementById('main-live-image');
            const phiAnalysisOutput = document.getElementById('phi-analysis-output');
            
            if (liveResultsContainer) liveResultsContainer.style.display = 'none';
            if (liveContainer) liveContainer.style.display = 'block';
            if (severitySummary) severitySummary.innerHTML = '';
            if (liveGrid) liveGrid.innerHTML = '';
            if (mainLiveImage) mainLiveImage.src = '';
            if (phiAnalysisOutput) phiAnalysisOutput.innerHTML = '<em>Analyzing...</em>';
        };
    }
    
    console.log("Live capture setup complete");
}