const API_URL = "/api/detect-acne";

export async function detectAcne(imageFile) {
    console.log("detectAcne called for:", imageFile.name);
    
    // Convert to base64
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
    
    console.log("Base64 length:", base64.length);
    
    // Call API
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const result = await response.json();
    console.log("Full API Response:", JSON.stringify(result, null, 2));
    
    if (!result.success) throw new Error(result.error || "Detection failed");
    
    // Make sure all required fields exist
    const safeResult = {
        success: true,
        annotated_image: result.annotated_image || "",
        region_images: result.region_images || [],
        face_regions: result.face_regions || [],
        region_acne_counts: result.region_acne_counts || {},
        region_severity: result.region_severity || {},
        total_acne: result.total_acne || 0,
        overall_severity: result.overall_severity || "Unknown"
    };
    
    console.log("Safe result:", safeResult);
    return safeResult;
}