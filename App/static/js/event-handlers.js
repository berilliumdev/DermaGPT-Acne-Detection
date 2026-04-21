import { elements } from "./dom-elements.js";
import { detectAcne } from "./acne-detection-service.js";

let currentImageFile = null;

export function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Browse button
    if (elements.browseImageBtn && elements.imageFileInput) {
        elements.browseImageBtn.onclick = () => {
            console.log("Browse clicked");
            elements.imageFileInput.click();
        };
        
        elements.imageFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log("File selected:", file.name);
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
    }
    
    // Detect button
    if (elements.processImageBtn) {
        elements.processImageBtn.onclick = () => {
            console.log("Detect button clicked");
            if (currentImageFile) {
                handleAcneDetection(currentImageFile);
            } else {
                alert("Please select an image first");
            }
        };
    }
    
    // Retake button
    if (elements.retakeImageBtn) {
        elements.retakeImageBtn.onclick = () => {
            currentImageFile = null;
            if (elements.imagePreview) elements.imagePreview.src = '#';
            if (elements.imageUploadArea) elements.imageUploadArea.style.display = 'block';
            if (elements.imagePreviewContainer) elements.imagePreviewContainer.style.display = 'none';
            if (elements.imageFileInput) elements.imageFileInput.value = '';
            if (elements.imageResults) elements.imageResults.style.display = 'none';
        };
    }
}

async function handleAcneDetection(file) {
    console.log("=== HANDLE ACNE DETECTION STARTED ===");
    console.log("File:", file.name);
    
    const container = document.getElementById("marked-images-container");
    if (!container) {
        console.error("Container not found!");
        return;
    }
    
    container.innerHTML = '<p>🔄 Processing image...</p>';
    if (elements.loadingIndicator) elements.loadingIndicator.style.display = "block";
    if (elements.imageResults) elements.imageResults.style.display = "block";
    
    try {
        const result = await detectAcne(file);
        console.log("Result received:", result);
        
        let html = '';
        
        // ============================================
        // FULL ANNOTATED IMAGE
        // ============================================
        if (result.annotated_image) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h4>📸 Full Analysis</h4>
                    <div style="text-align: center;">
                        <img src="${result.annotated_image}" style="max-width: 100%; border-radius: 8px; border: 1px solid #ddd;">
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center;">
                        <strong>📈 Total Acne:</strong> ${result.total_acne || 0} &nbsp;|&nbsp;
                        <strong>🏥 Overall Severity:</strong> <span style="color: ${result.overall_severity === 'Healthy' ? 'green' : (result.overall_severity === 'Mild' ? 'orange' : (result.overall_severity === 'Moderate' ? '#ff6600' : 'red'))}; font-weight: bold;">${result.overall_severity || "Unknown"}</span>
                    </div>
                </div>
            `;
        }
        
        // ============================================
        // 3x3 GRID FOR FACE REGIONS
        // ============================================
        if (result.region_images && result.region_images.length > 0) {
            html += '<h4>🔍 Region Analysis (3x3 Grid)</h4>';
            html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">';
            
            // Define the correct order for 3x3 grid (top to bottom, left to right)
            const gridOrder = [
                "forehead", "between-eyes", "nose",
                "left-eye", "right-eye", "mouth",
                "left-cheek", "right-cheek", "chin"
            ];
            
            // Sort regions according to grid order
            const sortedRegions = [];
            for (const expectedName of gridOrder) {
                const found = result.region_images.find(r => r.name === expectedName);
                if (found) {
                    sortedRegions.push(found);
                }
            }
            // Add any remaining regions not in gridOrder
            for (const region of result.region_images) {
                if (!sortedRegions.includes(region)) {
                    sortedRegions.push(region);
                }
            }
            
            for (const region of sortedRegions) {
                let severityColor = '';
                let bgColor = '';
                if (region.severity === 'Healthy') {
                    severityColor = '#4CAF50';
                    bgColor = '#e8f5e9';
                } else if (region.severity === 'Mild') {
                    severityColor = '#FF9800';
                    bgColor = '#fff3e0';
                } else if (region.severity === 'Moderate') {
                    severityColor = '#FF5722';
                    bgColor = '#fbe9e7';
                } else {
                    severityColor = '#f44336';
                    bgColor = '#ffebee';
                }
                
                html += `
                    <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; text-align: center; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <img src="${region.image}" style="width: 100%; height: 140px; object-fit: cover; background: #f5f5f5;">
                        <div style="padding: 12px; background: ${bgColor};">
                            <strong style="font-size: 14px; text-transform: capitalize;">${region.name.replace('-', ' ')}</strong><br>
                            <span style="font-size: 13px;">Acne: ${region.acne_count || 0}</span><br>
                            <span style="font-size: 13px; color: ${severityColor}; font-weight: bold;">${region.severity}</span>
                        </div>
                    </div>
                `;
            }
            html += '</div>';
        } else {
            html += '<p>⚠️ No region images available</p>';
        }
        
        // ============================================
        // SEVERITY TABLE (BELOW THE GRID)
        // ============================================
        html += '<h4>📋 Severity Table</h4>';
        
        if (Object.keys(result.region_severity || {}).length > 0) {
            html += `
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: #4CAF50; color: white;">
                            <th style="padding: 12px; text-align: left;">Region</th>
                            <th style="padding: 12px; text-align: center;">Acne Count</th>
                            <th style="padding: 12px; text-align: center;">Severity</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            // Sort table rows alphabetically by region name
            const sortedRegions = Object.keys(result.region_severity).sort();
            
            for (const name of sortedRegions) {
                const severity = result.region_severity[name];
                const count = result.region_acne_counts?.[name] || 0;
                
                let severityColor = '';
                let bgRow = '';
                if (severity === 'Healthy') {
                    severityColor = '#4CAF50';
                    bgRow = '#f9f9f9';
                } else if (severity === 'Mild') {
                    severityColor = '#FF9800';
                    bgRow = '#fff8e1';
                } else if (severity === 'Moderate') {
                    severityColor = '#FF5722';
                    bgRow = '#fff3e0';
                } else {
                    severityColor = '#f44336';
                    bgRow = '#ffebee';
                }
                
                html += `
                    <tr style="background: ${bgRow}; border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 12px; text-transform: capitalize;">${name.replace('-', ' ')}</td>
                        <td style="padding: 10px 12px; text-align: center;">${count}</td>
                        <td style="padding: 10px 12px; text-align: center; color: ${severityColor}; font-weight: bold;">${severity}</td>
                    </tr>
                `;
            }
            html += `
                    </tbody>
                </table>
            `;
        } else {
            html += '<p>No region data available</p>';
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Error in handleAcneDetection:", error);
        container.innerHTML = `<p style="color:red">❌ Error: ${error.message}</p>`;
    } finally {
        if (elements.loadingIndicator) elements.loadingIndicator.style.display = "none";
    }
    
    console.log("=== HANDLE ACNE DETECTION ENDED ===");
}