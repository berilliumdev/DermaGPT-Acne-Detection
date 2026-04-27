import { elements } from "./dom-elements.js";
import { detectAcne } from "./acne-detection-service.js";
import { analyzeWithPhi3 } from "./phi3-service.js";

let currentImageFile = null;
let currentTextFile = null;

export function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // ============================================
    // ACNE DETECTION - BROWSE BUTTON
    // ============================================
    if (elements.browseImageBtn && elements.imageFileInput) {
        // Remove any existing listeners to avoid duplicates
        const newBrowseBtn = elements.browseImageBtn.cloneNode(true);
        elements.browseImageBtn.parentNode.replaceChild(newBrowseBtn, elements.browseImageBtn);
        elements.browseImageBtn = newBrowseBtn;
        
        elements.browseImageBtn.onclick = () => {
            console.log("Browse image button clicked");
            elements.imageFileInput.click();
        };
        
        elements.imageFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log("Image file selected:", file.name);
                currentImageFile = file;
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (elements.imagePreview) {
                        elements.imagePreview.src = event.target.result;
                    }
                    if (elements.imageUploadArea) {
                        elements.imageUploadArea.style.display = 'none';
                    }
                    if (elements.imagePreviewContainer) {
                        elements.imagePreviewContainer.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    } else {
        console.warn("Browse image button or file input not found");
    }
    
    // ============================================
    // ACNE DETECTION - PROCESS BUTTON
    // ============================================
    if (elements.processImageBtn) {
        // Remove any existing listeners
        const newProcessBtn = elements.processImageBtn.cloneNode(true);
        elements.processImageBtn.parentNode.replaceChild(newProcessBtn, elements.processImageBtn);
        elements.processImageBtn = newProcessBtn;
        
        elements.processImageBtn.onclick = () => {
            console.log("Process image button clicked");
            if (currentImageFile) {
                handleAcneDetection(currentImageFile);
            } else {
                alert("Please select an image first");
            }
        };
    }
    
    // ============================================
    // ACNE DETECTION - RETAKE BUTTON
    // ============================================
    if (elements.retakeImageBtn) {
        elements.retakeImageBtn.onclick = () => {
            console.log("Retake image button clicked");
            currentImageFile = null;
            if (elements.imagePreview) elements.imagePreview.src = '#';
            if (elements.imageUploadArea) elements.imageUploadArea.style.display = 'block';
            if (elements.imagePreviewContainer) elements.imagePreviewContainer.style.display = 'none';
            if (elements.imageFileInput) elements.imageFileInput.value = '';
            if (elements.imageResults) elements.imageResults.style.display = 'none';
        };
    }
    
    // ============================================
    // TEXT ANALYSIS - BROWSE BUTTON
    // ============================================
    if (elements.browseTextBtn && elements.textFileInput) {
        // Remove any existing listeners
        const newTextBrowseBtn = elements.browseTextBtn.cloneNode(true);
        elements.browseTextBtn.parentNode.replaceChild(newTextBrowseBtn, elements.browseTextBtn);
        elements.browseTextBtn = newTextBrowseBtn;
        
        elements.browseTextBtn.onclick = () => {
            console.log("Browse text button clicked");
            elements.textFileInput.click();
        };
        
        elements.textFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log("Text file selected:", file.name);
                currentTextFile = file;
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (elements.textImagePreview) {
                        elements.textImagePreview.src = event.target.result;
                    }
                    if (elements.textUploadArea) {
                        elements.textUploadArea.style.display = 'none';
                    }
                    if (elements.textPreviewContainer) {
                        elements.textPreviewContainer.style.display = 'flex';
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    } else {
        console.warn("Browse text button or text file input not found");
        console.log("browseTextBtn:", elements.browseTextBtn);
        console.log("textFileInput:", elements.textFileInput);
    }
    
    // ============================================
    // TEXT ANALYSIS - PROCESS BUTTON
    // ============================================
    if (elements.processTextBtn) {
        // Remove any existing listeners
        const newTextProcessBtn = elements.processTextBtn.cloneNode(true);
        elements.processTextBtn.parentNode.replaceChild(newTextProcessBtn, elements.processTextBtn);
        elements.processTextBtn = newTextProcessBtn;
        
        elements.processTextBtn.onclick = () => {
            console.log("Process text button clicked");
            if (currentTextFile) {
                handleTextAnalysis(currentTextFile);
            } else {
                alert("Please select an image first");
            }
        };
    }
    
    // ============================================
    // TEXT ANALYSIS - RETAKE BUTTON
    // ============================================
    if (elements.retakeTextBtn) {
        elements.retakeTextBtn.onclick = () => {
            console.log("Retake text button clicked");
            currentTextFile = null;
            if (elements.textImagePreview) elements.textImagePreview.src = '#';
            if (elements.textUploadArea) elements.textUploadArea.style.display = 'block';
            if (elements.textPreviewContainer) elements.textPreviewContainer.style.display = 'none';
            if (elements.textFileInput) elements.textFileInput.value = '';
            if (elements.textResults) elements.textResults.style.display = 'none';
        };
    }
    
    console.log("Event listeners setup complete");
}

// ============================================
// HANDLE ACNE DETECTION
// ============================================
async function handleAcneDetection(file) {
    const container = document.getElementById("marked-images-container");
    if (container) container.innerHTML = '<p>🔄 Processing image...</p>';
    if (elements.loadingIndicator) elements.loadingIndicator.style.display = "block";
    if (elements.imageResults) elements.imageResults.style.display = "block";
    
    try {
        const result = await detectAcne(file);
        
        let html = '<h4>📸 Full Analysis</h4>';
        
        // Annotated image
        if (result.annotated_image) {
            html += `<div style="text-align:center; margin-bottom:20px;">
                        <img src="${result.annotated_image}" style="max-width:100%; border-radius:8px; border:1px solid #ddd;">
                     </div>`;
        }
        
        // Total stats
        html += `<div style="background:#f0f0f0; padding:15px; border-radius:8px; margin-bottom:20px; text-align:center;">
                    <strong>📈 Total Acne:</strong> ${result.total_acne || 0}<br>
                    <strong>🏥 Overall Severity:</strong> ${result.overall_severity || "Unknown"}
                 </div>`;
        
        // 3x3 Grid
        if (result.region_images && result.region_images.length > 0) {
            html += '<h4>🔍 Region Analysis (3x3 Grid)</h4>';
            html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">';
            
            const gridOrder = ["forehead", "between-eyes", "nose", "left-eye", "right-eye", "mouth", "left-cheek", "right-cheek", "chin"];
            
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
                    
                    html += `
                        <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; text-align: center; background: white;">
                            <img src="${region.image}" style="width:100%; height:120px; object-fit:cover;">
                            <div style="padding:10px; background:${bgColor};">
                                <strong>${region.name.replace('-', ' ')}</strong><br>
                                Acne: ${region.acne_count}<br>
                                <span style="color:${severityColor}; font-weight:bold;">${region.severity}</span>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div style="border:1px dashed #ccc; border-radius:10px; text-align:center; background:#fafafa; display:flex; align-items:center; justify-content:center; min-height:180px;">
                            <span style="color:#999;">${expectedName.replace('-', ' ')}<br>Not detected</span>
                        </div>
                    `;
                }
            }
            html += '</div>';
        }
        
        // Severity table
        html += '<h4>📋 Severity Table</h4>';
        html += '<table style="width:100%; border-collapse:collapse;">';
        html += '<tr style="background:#ddd;"><th style="padding:8px;">Region</th><th style="padding:8px;">Acne</th><th style="padding:8px;">Severity</th></tr>';
        
        for (const [name, severity] of Object.entries(result.region_severity || {})) {
            let color = severity === 'Healthy' ? 'green' : (severity === 'Mild' ? 'orange' : (severity === 'Moderate' ? '#ff6600' : 'red'));
            let count = result.region_acne_counts?.[name] || 0;
            html += `<tr><td style="padding:8px;">${name}</td><td style="padding:8px;">${count}</td><td style="padding:8px; color:${color};">${severity}</td></tr>`;
        }
        html += '</table>';
        
        if (container) container.innerHTML = html;
        
    } catch (error) {
        console.error("Acne detection error:", error);
        if (container) container.innerHTML = `<p style="color:red">❌ Error: ${error.message}</p>`;
    } finally {
        if (elements.loadingIndicator) elements.loadingIndicator.style.display = "none";
    }
}

// ============================================
// HANDLE TEXT ANALYSIS
// ============================================
async function handleTextAnalysis(file) {
    console.log("handleTextAnalysis called for:", file.name);
    
    if (elements.textOutput) {
        elements.textOutput.innerHTML = '<p>🔄 Analyzing with AI...</p>';
    }
    if (elements.loadingIndicator) elements.loadingIndicator.style.display = "block";
    if (elements.textResults) elements.textResults.style.display = "block";
    
    try {
        const result = await analyzeWithPhi3(file);
        console.log("Text analysis result received");
        
        if (elements.textOutput) {
            // Format the analysis with line breaks
            const formattedAnalysis = result.analysis.replace(/\n/g, '<br>');
            elements.textOutput.innerHTML = formattedAnalysis;
        }
    } catch (error) {
        console.error("Text analysis error:", error);
        if (elements.textOutput) {
            elements.textOutput.innerHTML = `<p style="color:red">❌ Error: ${error.message}</p>`;
        }
    } finally {
        if (elements.loadingIndicator) elements.loadingIndicator.style.display = "none";
    }
}