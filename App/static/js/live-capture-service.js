// Live Capture Service - Full Working Version
let stream = null;
let videoElement = null;
let canvasElement = null;

export function setupLiveCapture() {
    console.log("Setting up live capture...");
    
    // Get DOM elements
    const startBtn = document.getElementById('start-live-btn');
    const cancelBtn = document.getElementById('cancel-live-btn');
    const captureBtn = document.getElementById('capture-btn');
    const retakeLiveBtn = document.getElementById('retake-live-btn');
    const liveContainer = document.getElementById('live-container');
    const video = document.getElementById('video');
    const liveResultsContainer = document.getElementById('live-results-container');
    const mainLiveImage = document.getElementById('main-live-image');
    const liveGrid = document.getElementById('live-grid');
    const severitySummary = document.getElementById('severity-summary');
    const phiAnalysisOutput = document.getElementById('phi-analysis-output');
    const livePhiAnalysis = document.getElementById('live-phi-analysis');
    
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
                    console.log("Camera started successfully");
                }
            } catch (err) {
                console.error("Camera error:", err);
                alert("Could not access camera. Please check permissions.");
            }
        };
    }
    
    // ============================================
    // CANCEL CAMERA
    // ============================================
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            console.log("Cancel clicked");
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            if (liveContainer) liveContainer.style.display = 'none';
            if (videoElement) videoElement.srcObject = null;
        };
    }
    
    // ============================================
    // CAPTURE PHOTO & ANALYZE
    // ============================================
    if (captureBtn) {
        captureBtn.onclick = async () => {
            console.log("Capture clicked");
            
            if (!videoElement || !videoElement.videoWidth) {
                alert("Please wait for camera to start");
                return;
            }
            
            // Capture frame from video
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            const ctx = canvasElement.getContext('2d');
            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            
            // Get image as base64
            const imageData = canvasElement.toDataURL('image/jpeg', 0.9);
            
            // Show results container and loading state
            if (liveResultsContainer) liveResultsContainer.style.display = 'block';
            if (liveContainer) liveContainer.style.display = 'none';
            if (severitySummary) severitySummary.innerHTML = '<p>🔄 Processing image...</p>';
            if (liveGrid) liveGrid.innerHTML = '<p>Analyzing face regions...</p>';
            if (phiAnalysisOutput) phiAnalysisOutput.innerHTML = '<em>Generating analysis...</em>';
            if (livePhiAnalysis) livePhiAnalysis.style.display = 'block';
            
            try {
                // Call acne detection API
                console.log("Sending to /api/detect-acne...");
                const response = await fetch('/api/detect-acne', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: imageData })
                });
                
                const result = await response.json();
                console.log("Live capture result:", result);
                
                if (result.success) {
                    // Show full annotated image
                    if (mainLiveImage) {
                        mainLiveImage.src = result.annotated_image;
                    }
                    
                    // Show severity summary
                    if (severitySummary) {
                        let severityColor = '#4CAF50';
                        if (result.overall_severity === 'Mild') severityColor = '#FF9800';
                        else if (result.overall_severity === 'Moderate') severityColor = '#FF5722';
                        else if (result.overall_severity === 'Severe') severityColor = '#f44336';
                        
                        severitySummary.innerHTML = `
                            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center;">
                                <strong>📈 Total Acne:</strong> ${result.total_acne || 0}<br>
                                <strong>🏥 Overall Severity:</strong> 
                                <span style="color: ${severityColor}; font-weight: bold;">${result.overall_severity || "Unknown"}</span>
                            </div>
                        `;
                    }
                    
                    // Show 3x3 grid of regions
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
                                            <strong style="font-size: 12px;">${region.name.replace('-', ' ')}</strong><br>
                                            <span style="font-size: 11px;">Acne: ${region.acne_count}</span><br>
                                            <span style="font-size: 11px; color: ${severityColor}; font-weight: bold;">${region.severity}</span>
                                        </div>
                                    </div>
                                `;
                            } else {
                                gridHtml += `
                                    <div style="border: 1px dashed #ccc; border-radius: 10px; text-align: center; background: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 180px;">
                                        <span style="color: #999; font-size: 12px;">${expectedName.replace('-', ' ')}<br>Not detected</span>
                                    </div>
                                `;
                            }
                        }
                        gridHtml += '</div>';
                        liveGrid.innerHTML = gridHtml;
                    }
                    
                    // Get text analysis
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
                        if (phiResult.success && phiAnalysisOutput) {
                            phiAnalysisOutput.innerHTML = phiResult.analysis.replace(/\n/g, '<br>');
                        }
                    } catch (phiError) {
                        console.error("Text analysis error:", phiError);
                        if (phiAnalysisOutput) {
                            phiAnalysisOutput.innerHTML = '<em>Text analysis temporarily unavailable</em>';
                        }
                    }
                    
                } else {
                    if (severitySummary) {
                        severitySummary.innerHTML = `<p style="color:red">❌ Error: ${result.error}</p>`;
                    }
                }
                
            } catch (error) {
                console.error("Live capture error:", error);
                if (severitySummary) {
                    severitySummary.innerHTML = `<p style="color:red">❌ Error: ${error.message}</p>`;
                }
            }
        };
    }
    
    // ============================================
    // RETAKE PHOTO
    // ============================================
    if (retakeLiveBtn) {
        retakeLiveBtn.onclick = () => {
            console.log("Retake clicked");
            
            // Hide results, show camera again
            if (liveResultsContainer) liveResultsContainer.style.display = 'none';
            if (liveContainer) liveContainer.style.display = 'block';
            
            // Clear previous results
            if (severitySummary) severitySummary.innerHTML = '';
            if (liveGrid) liveGrid.innerHTML = '';
            if (mainLiveImage) mainLiveImage.src = '';
            if (phiAnalysisOutput) phiAnalysisOutput.innerHTML = '<em>Waiting for analysis...</em>';
            if (livePhiAnalysis) livePhiAnalysis.style.display = 'none';
        };
    }
    
    console.log("Live capture setup complete");
}