const PHI3_API_URL = "/api/phi3-analyze";

export async function analyzeWithPhi3(imageFile) {
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
    
    // First get acne results
    const detectRes = await fetch("/api/detect-acne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
    });
    
    const detectResult = await detectRes.json();
    if (!detectResult.success) throw new Error(detectResult.error);
    
    // Then get text analysis
    const textRes = await fetch(PHI3_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            total_acne: detectResult.total_acne,
            overall_severity: detectResult.overall_severity,
            region_severity: detectResult.region_severity
        })
    });
    
    const textResult = await textRes.json();
    if (!textResult.success) throw new Error(textResult.error);
    
    return { analysis: textResult.analysis };
}