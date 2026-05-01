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
            html += `<div class="annotated-image-wrapper">
                        <img class="annotated-image" src="${result.annotated_image}" alt="Annotated acne image">
                     </div>`;
        }
        
        // Total stats
        html += `<div class="total-stats-card">
                    <div><strong>📈 Total Acne:</strong> ${result.total_acne || 0}</div>
                    <div><strong>🏥 Overall Severity:</strong> ${result.overall_severity || "Unknown"}</div>
                 </div>`;
        
        html += '<div class="grid-table-wrap">';
        
        // 3x3 Grid
        html += '<div class="grid-panel">';
        html += '<h4>🔍 Region Analysis (3x3 Grid)</h4>';
        html += '<div class="acne-results-grid">';
        
        const gridOrder = ["forehead", "between-eyes", "nose", "left-eye", "right-eye", "mouth", "left-cheek", "right-cheek", "chin"];
        
        for (const expectedName of gridOrder) {
            const region = result.region_images?.find(r => r.name === expectedName);
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
                    <div class="region-card">
                        <img src="${region.image}" alt="${region.name}">
                        <div style="padding:0 0.5rem 0.75rem;">
                            <strong>${region.name.replace('-', ' ')}</strong>
                            <div style="margin-top:0.5rem; font-size:0.95rem; color:#555;">Acne: ${region.acne_count}</div>
                            <div style="margin-top:0.25rem; color:${severityColor}; font-weight:700;">${region.severity}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="region-card" style="display:flex; align-items:center; justify-content:center; min-height:180px;">
                        <span style="color:#999;">${expectedName.replace('-', ' ')}<br>Not detected</span>
                    </div>
                `;
            }
        }
        html += '</div>';
        html += '</div>';
        
        // Severity table panel
        html += '<div class="severity-table-panel">';
        html += '<h4>📋 Severity Table</h4>';
        html += '<table class="severity-table">';
        html += '<thead><tr><th>Region</th><th>Acne</th><th>Severity</th></tr></thead>';
        html += '<tbody>';
        
        for (const [name, severity] of Object.entries(result.region_severity || {})) {
            let color = severity === 'Healthy' ? '#4CAF50' : (severity === 'Mild' ? '#FF9800' : (severity === 'Moderate' ? '#FF5722' : '#f44336'));
            let count = result.region_acne_counts?.[name] || 0;
            html += `<tr><td>${name.replace('-', ' ')}</td><td>${count}</td><td style="color:${color}; font-weight:700;">${severity}</td></tr>`;
        }
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
        
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