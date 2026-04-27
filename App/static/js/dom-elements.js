// DOM Elements
export const elements = {
    // Acne Detection elements
    imageFileInput: document.getElementById('image-file-input'),
    browseImageBtn: document.getElementById('browse-image-btn'),
    imageUploadArea: document.getElementById('image-upload-area'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview-2'),
    processImageBtn: document.getElementById('process-image-btn'),
    retakeImageBtn: document.getElementById('retake-image-btn'),
    imageResults: document.getElementById('image-results'),
    loadingIndicator: document.getElementById('loading-indicator'),
    
    // Text Analysis elements
    textFileInput: document.getElementById('text-file-input'),
    browseTextBtn: document.getElementById('browse-text-btn'),
    textUploadArea: document.getElementById('text-upload-area'),
    textPreviewContainer: document.getElementById('text-preview-container'),
    textImagePreview: document.getElementById('image-preview'),
    processTextBtn: document.getElementById('process-text-btn'),
    retakeTextBtn: document.getElementById('retake-text-btn'),
    textOutput: document.getElementById('text-output'),
    textResults: document.getElementById('text-results'),
};

console.log("DOM elements loaded");
console.log("Text browse button:", elements.browseTextBtn);
console.log("Text file input:", elements.textFileInput);