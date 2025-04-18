let beautyProcessor = null;
let virtualBgProcessor = null;
let beautyEnabled = false;
let currentPipeline = null;

// Beauty effect variables
let isBeautyEnabled = false;
window.isBeautyEnabled = false;

// Beauty effect parameters
let contrastLevel = 1;
let smoothnessLevel = 50;
let whiteLevel = 60;
let rednessLevel = 10;
let sharpnessLevel = 30;

// Initialize beauty extension
const beautyExtension = new BeautyExtension();
AgoraRTC.registerExtensions([beautyExtension]);

// Create beauty processor
function createBeautyProcessor() {
    if (!beautyProcessor) {
        beautyProcessor = beautyExtension.createProcessor();
        console.log("Created new beauty processor:", beautyProcessor);
    }
    return beautyProcessor;
}

// Helper function to completely clean up all processors
async function cleanupProcessors() {
    console.log("Cleaning up all processors...");
    
    try {
        // First unpipe the video track from any existing connections
        if (window.localVideoTrack) {
            console.log("Unpiping video track");
            await window.localVideoTrack.unpipe();
            console.log("Video track unpiped successfully");
        }

        // Then disable and unpipe beauty processor if it exists
        if (beautyProcessor) {
            console.log("Cleaning up beauty processor");
            try {
                await beautyProcessor.unpipe();
                await beautyProcessor.disable();
                console.log("Beauty processor cleaned up");
            } catch (error) {
                console.error("Error cleaning up beauty processor:", error);
            }
        }
        
        // Then disable and unpipe virtual background processor if it exists
        if (virtualBgProcessor) {
            console.log("Cleaning up virtual background processor");
            try {
                await virtualBgProcessor.unpipe();
                await virtualBgProcessor.disable();
                console.log("Virtual background processor cleaned up");
            } catch (error) {
                console.error("Error cleaning up virtual background processor:", error);
            }
        }

        // Reset pipeline reference
        currentPipeline = null;

        // Reset processor destination
        if (window.localVideoTrack && window.localVideoTrack.processorDestination) {
            try {
                window.localVideoTrack.processorDestination = null;
                console.log("Reset processor destination");
            } catch (error) {
                console.error("Error resetting processor destination:", error);
            }
        }

        console.log("All processors cleaned up");
    } catch (error) {
        console.error("Error during cleanup:", error);
        throw error;
    }
}

// Helper function to rebuild the video pipeline
async function rebuildVideoPipeline() {
    try {
        console.log("Rebuilding video pipeline...");
        
        // First, completely clean up all processors
        await cleanupProcessors();

        if (!window.localVideoTrack) {
            console.error("No local video track available");
            return;
        }

        // Check states using the global flags
        const isVirtualBgEnabled = window.isVirtualBackgroundEnabled;  // This is set in app.js
        console.log("Is virtual background enabled:", isVirtualBgEnabled);
        console.log("Is beauty enabled:", beautyEnabled);
        
        // Start fresh with the local track
        let chain = window.localVideoTrack;
        
        try {
            // Step 1: Add virtual background if enabled
            if (isVirtualBgEnabled && window.virtualBackgroundProcessor) {
                console.log("Adding virtual background to pipeline");
                await window.virtualBackgroundProcessor.enable();
                chain = chain.pipe(window.virtualBackgroundProcessor);
                console.log("Added virtual background to pipeline");
            }

            // Step 2: Add beauty if enabled
            if (beautyEnabled && beautyProcessor) {
                console.log("Adding beauty to pipeline");
                await beautyProcessor.enable();
                chain = chain.pipe(beautyProcessor);
                console.log("Added beauty to pipeline");
            }

            // Step 3: Connect to destination
            console.log("Connecting to processor destination");
            chain = chain.pipe(window.localVideoTrack.processorDestination);
            currentPipeline = chain;
            
            console.log("Pipeline rebuilt successfully");
        } catch (error) {
            console.error("Error building pipeline:", error);
            // If we hit an error, try to clean up
            await cleanupProcessors();
            throw error;
        }
    } catch (error) {
        console.error("Error rebuilding video pipeline:", error);
        throw error;
    }
}

// Toggle beauty effect
async function toggleBeauty() {
    const beautyBtn = document.getElementById('beautyBtn');
    const beautyControls = document.getElementById('beautyControls');
    
    // Get the local video track from the app.js file
    if (typeof window.localVideoTrack === 'undefined') {
        console.log("No local video track available");
        showPopup("No video track available");
        return;
    }
    
    try {
        if (!isBeautyEnabled) {
            console.log("Enabling beauty effect...");
            showPopup("Enabling beauty effect...");
            
            // Clean up all processors first to ensure a clean state
            if (window.cleanupProcessors) {
                console.log("Cleaning up processors before enabling beauty");
                await window.cleanupProcessors();
            }
            
            // Create and register beauty extension
            const beauty = new BeautyExtension();
            AgoraRTC.registerExtensions([beauty]);
            
            // Create processor
            beautyProcessor = await beauty.createProcessor();
            
            // Set up event handlers
            beautyProcessor.eventBus.on("PERFORMANCE_WARNING", () => {
                console.warn("Beauty performance warning!");
                showPopup("Beauty performance warning!");
            });
            
            beautyProcessor.onoverload = async () => {
                console.log("Beauty overload!");
                showPopup("Beauty overload!");
            };
            
            // Initialize processor
            try {
                await beautyProcessor.init("not_needed");
            } catch (error) {
                console.error(error);
                showPopup("Failed to initialize beauty effect");
                return;
            }
            
            // Set beauty parameters
            updateBeautyParams();
            
            // Enable processor
            await beautyProcessor.enable();
            
            // Store the processor in the window object
            window.beautyProcessor = beautyProcessor;
            
            // Set beauty as enabled BEFORE rebuilding pipeline
            beautyEnabled = true;
            isBeautyEnabled = true;
            window.isBeautyEnabled = true;
            
            // Rebuild the video pipeline
            await rebuildVideoPipeline();
            
            beautyBtn.textContent = "Disable Beauty";
            beautyBtn.style.background = '#fff3cd';
            beautyControls.style.display = 'flex';
            showPopup("Beauty effect enabled");
        } else {
            console.log("Disabling beauty effect...");
            showPopup("Disabling beauty effect...");
            
            // Set beauty as disabled BEFORE cleaning up
            beautyEnabled = false;
            isBeautyEnabled = false;
            window.isBeautyEnabled = false;
            
            // Clean up all processors first to ensure a clean state
            if (window.cleanupProcessors) {
                console.log("Cleaning up processors before disabling beauty");
                await window.cleanupProcessors();
            }
            
            // Disable beauty processor
            if (beautyProcessor) {
                await beautyProcessor.disable();
                beautyProcessor = null;
                window.beautyProcessor = null;
            }
            
            // Rebuild the video pipeline
            await rebuildVideoPipeline();
            
            beautyBtn.textContent = "Enable Beauty";
            beautyBtn.style.background = '#fff3cd';
            beautyControls.style.display = 'none';
            showPopup("Beauty effect disabled");
        }
    } catch (error) {
        console.error("Error toggling beauty effect:", error);
        showPopup("Failed to toggle beauty effect");
    }
}

// Function to update beauty parameters
async function updateBeautyParams() {
    if (!beautyProcessor || !isBeautyEnabled) return;
    
    try {
        // Get values from sliders
        contrastLevel = parseInt(document.getElementById('contrastLevel').value);
        smoothnessLevel = parseInt(document.getElementById('smoothnessLevel').value);
        whiteLevel = parseInt(document.getElementById('whiteLevel').value);
        rednessLevel = parseInt(document.getElementById('rednessLevel').value);
        sharpnessLevel = parseInt(document.getElementById('sharpnessLevel').value);
        
        // Update display values
        document.getElementById('contrastValue').textContent = contrastLevel;
        document.getElementById('smoothnessValue').textContent = (smoothnessLevel / 100).toFixed(1);
        document.getElementById('whiteValue').textContent = (whiteLevel / 100).toFixed(1);
        document.getElementById('rednessValue').textContent = (rednessLevel / 100).toFixed(1);
        document.getElementById('sharpnessValue').textContent = (sharpnessLevel / 100).toFixed(1);
        
        // Set beauty parameters
        await beautyProcessor.setOptions({
            contrastLevel: contrastLevel,
            smoothnessLevel: smoothnessLevel / 100,
            whiteLevel: whiteLevel / 100,
            rednessLevel: rednessLevel / 100,
            sharpnessLevel: sharpnessLevel / 100
        });
        
        console.log("Beauty parameters updated");
    } catch (error) {
        console.error("Error updating beauty parameters:", error);
    }
}

// Function to initialize beauty controls
function initBeautyControls() {
    const beautyControls = document.getElementById('beautyControls');
    const beautyBtn = document.getElementById('beautyBtn');
    
    // Style the beauty button to match other buttons
    beautyBtn.style.background = '#fff3cd';
    beautyBtn.style.border = '1px solid #ffeeba';
    beautyBtn.style.color = '#856404';
    beautyBtn.style.padding = '6px 12px';
    beautyBtn.style.borderRadius = '4px';
    beautyBtn.style.cursor = 'pointer';
    
    // Add event listener to beauty button
    beautyBtn.addEventListener('click', toggleBeauty);
    
    // Add event listeners to beauty control sliders
    document.getElementById('contrastLevel').addEventListener('input', updateBeautyParams);
    document.getElementById('smoothnessLevel').addEventListener('input', updateBeautyParams);
    document.getElementById('whiteLevel').addEventListener('input', updateBeautyParams);
    document.getElementById('rednessLevel').addEventListener('input', updateBeautyParams);
    document.getElementById('sharpnessLevel').addEventListener('input', updateBeautyParams);
    
    // Style the beauty controls to match the app theme
    const sliders = beautyControls.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.style.accentColor = '#ffc107';
    });
}

// Export functions
window.toggleBeauty = toggleBeauty;
window.updateBeautyParams = updateBeautyParams;
window.initBeautyControls = initBeautyControls;
window.rebuildVideoPipeline = rebuildVideoPipeline;
window.cleanupProcessors = cleanupProcessors; 