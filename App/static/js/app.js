// Main App
import { elements } from "./dom-elements.js";
import { setupEventListeners } from "./event-handlers.js";
import { setupLiveCapture } from "./live-capture-service.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log("App starting...");
    
    // Setup main event listeners
    setupEventListeners();
    
    // Setup live capture
    setupLiveCapture();
    
    console.log("App ready!");
});