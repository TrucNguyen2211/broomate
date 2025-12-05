// Core dependencies
const express = require('express');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cors = require('cors');

// Initialize the Express Router
const router = express.Router();

// Apply CORS and JSON body parser
router.use(cors());
router.use(express.json());

// --- CONFIGURATION & CREDENTIALS SETUP ---

// Environmental variable for Vision API key path/content
const VISION_KEY_DATA = process.env.GOOGLE_VISION_KEY_PATH;

let tempKeyPath = null;

/**
 * Sets up Google Application Credentials by writing JSON content to a temporary file.
 * @param {string} keyContent The JSON content of the service account key.
 * @returns {boolean} True if setup was successful, false otherwise.
 */
function setupCredentials(keyContent) {
    try {
        // Create a temporary file path in the OS temp directory
        tempKeyPath = path.join(os.tmpdir(), 'vision_key_temp.json');
        fs.writeFileSync(tempKeyPath, keyContent);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
        return true;
    } catch (e) {
        console.error("❌ ERROR: Failed to write temporary key file:", e.message);
        return false;
    }
}

// Credential Loading Logic
if (VISION_KEY_DATA) {
    const trimmedData = VISION_KEY_DATA.trim();
    if (trimmedData.startsWith('{') && trimmedData.endsWith('}')) {
        // Assume key data is the JSON content itself
        if (setupCredentials(trimmedData)) {
            console.log(`✅ Google Vision credentials loaded successfully from JSON content.`);
        } else {
            // Exit if key content is present but invalid
            process.exit(1);
        }
    } else if (fs.existsSync(VISION_KEY_DATA)) {
        // Assume key data is a valid file path
        process.env.GOOGLE_APPLICATION_CREDENTIALS = VISION_KEY_DATA;
        console.log(`✅ Google Vision credentials loaded from file path: ${VISION_KEY_DATA}`);
    } else {
        console.warn("⚠️ GOOGLE_VISION_KEY_PATH set but is neither a valid file path nor a full JSON content. Relying on Application Default Credentials (ADC).");
    }
} else {
    console.warn("⚠️ No Vision key data found. Relying on Application Default Credentials (ADC).");
}

// Initialize Google Vision Client
const client = new ImageAnnotatorClient();

// --- MULTER SETUP FOR FILE UPLOADS ---
// Use OS temp dir (writable on Vercel) for uploads to avoid EROFS in read-only FS
const UPLOADS_DIR = path.join(os.tmpdir(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
// Configure multer to store uploaded files temporarily
const upload = multer({ dest: UPLOADS_DIR });

// --- MAIN IMAGE INTEGRITY DETECTION LOGIC ---

/**
 * Detects if an image is stolen from the web (full/partial match) or is AI-generated.
 * @param {string} imagePath Local path to the uploaded image file.
 * @returns {Promise<{isOriginal: boolean, reason: string, stolen_check: boolean, ai_check: boolean, stolen_source: string | null, webDetection: object, labelAnnotations: object[]}>}
 */
async function detectImageIntegrity(imagePath) {
    // 1. Prepare Vision API Request
    const request = {
        image: { content: fs.readFileSync(imagePath).toString('base64') },
        features: [
            { type: 'WEB_DETECTION' }, // Check for web duplicates (stolen)
            { type: 'LABEL_DETECTION' } // Check for AI/General labels
        ],
    };

    const [result] = await client.annotateImage(request);

    const webDetection = result.webDetection;
    const labelAnnotations = result.labelAnnotations || [];

    let isStolen = false;
    let isAI = false;
    let reason = "Image appears to be original (In-camera photo).";
    let stolenSource = null;
    let finalResult = true; // Default assumption: Original

    // 2. --- CHECK FOR STOLEN/DUPLICATE (WEB_DETECTION) ---
    // Rule: If image is found anywhere (Full or Partial match), it is NOT Original.

    if (webDetection && webDetection.fullMatchingImages && webDetection.fullMatchingImages.length > 0) {
        // Case 1: Full Match (Highest confidence of being stolen)
        const count = webDetection.fullMatchingImages.length;
        isStolen = true;
        finalResult = false;
        stolenSource = webDetection.fullMatchingImages[0].url || 'Unknown source';
        reason = `⚠️ Image has ${count} FULL matches on the Internet. Very likely copied. First match source: ${stolenSource}`;

    } else if (webDetection && webDetection.partialMatchingImages && webDetection.partialMatchingImages.length > 0) {
        // Case 2: Partial Match (Still indicates it's not a new/original upload, e.g., stock photo, meme, widely shared content)
        isStolen = true;
        finalResult = false;
        stolenSource = webDetection.partialMatchingImages[0].url || 'Unknown source';
        reason = `⚠️ Image has ${webDetection.partialMatchingImages.length} PARTIAL matches on the Internet. It is not an original, freshly uploaded image. First reference source: ${stolenSource}`;
    }


    // 3. --- CHECK FOR AI GENERATION (LABEL_DETECTION) ---
    // Only check for AI if the image hasn't already been flagged as Stolen.
    const aiLabels = ['ai generated', 'ai art', 'digital art', 'artificial intelligence'];
    const AI_SCORE_THRESHOLD = 0.8; // Set a strict threshold for AI labels

    const aiLabelFound = labelAnnotations.find(label =>
        aiLabels.includes(label.description.toLowerCase()) && label.score > AI_SCORE_THRESHOLD
    );

    if (finalResult === true && aiLabelFound) {
        isAI = true;
        finalResult = false; // Override finalResult if AI is detected
        reason = `❌ Image is highly likely (${(aiLabelFound.score * 100).toFixed(1)}%) AI-generated (${aiLabelFound.description}).`;
        stolenSource = null; // Clear stolen source if we're changing the reason to AI
    }

    // 4. Return Final Integrity Assessment
    return {
        isOriginal: finalResult,
        reason: reason,
        stolen_check: isStolen,
        ai_check: isAI,
        stolen_source: stolenSource,
        webDetection: webDetection,
        labelAnnotations: labelAnnotations
    };
}

// --- REST API ENDPOINT ---

router.post('/verify-image', upload.single('imageFile'), async (req, res) => {
    // 1. Input Validation
    if (!req.file) {
        return res.status(400).send({ error: 'No image file found in the request.' });
    }

    const imagePath = req.file.path;

    try {
        // 2. Run Detection Logic
        const result = await detectImageIntegrity(imagePath);

        // 3. Cleanup temporary file
        fs.unlinkSync(imagePath);

        console.log(`[${new Date().toISOString()}] Successfully verified image: ${req.file.originalname} -> isOriginal: ${result.isOriginal}`);

        // 4. Send response
        res.json(result);

    } catch (error) {
        console.error('Error calling Google Vision API:', error);

        // 5. Ensure cleanup even on error
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // 6. Provide user-friendly error messages
        const errorMessage = (error.message && error.message.includes('default credentials'))
            ? 'Authentication Error: Please check GOOGLE_VISION_KEY_PATH.'
            : 'Error during API processing.';

        res.status(500).send({
            error: errorMessage,
            details: error.message
        });
    }
});

module.exports = router;
