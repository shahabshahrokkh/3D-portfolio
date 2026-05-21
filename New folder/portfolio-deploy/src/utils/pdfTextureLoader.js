import * as THREE from 'three';

/**
 * Create a beautiful resume preview texture
 */
export async function loadPDFAsTexture(pdfPath) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size (A4 aspect ratio)
        canvas.width = 2048;
        canvas.height = 2896; // A4 ratio: 210x297mm ≈ 1:1.414

        // White background with slight gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8f9fa');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle shadow border
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        // Main border
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        ctx.shadowColor = 'transparent';

        // Header section with colored background
        const headerGradient = ctx.createLinearGradient(0, 80, 0, 400);
        headerGradient.addColorStop(0, '#667eea');
        headerGradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(80, 80, canvas.width - 160, 320);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 140px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RESUME', canvas.width / 2, 240);

        // Subtitle
        ctx.font = '60px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText('Professional Portfolio', canvas.width / 2, 340);

        // Icon
        ctx.font = '200px Arial';
        ctx.fillText('📄', canvas.width / 2, 650);

        // Main text
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 80px Arial, sans-serif';
        ctx.fillText('Click to View Full Resume', canvas.width / 2, 850);

        // Decorative lines
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 400, 920);
        ctx.lineTo(canvas.width / 2 + 400, 920);
        ctx.stroke();

        // Info sections
        const sections = [
            { icon: '👤', text: 'Personal Information', y: 1100 },
            { icon: '🎓', text: 'Education & Skills', y: 1300 },
            { icon: '💼', text: 'Work Experience', y: 1500 },
            { icon: '🚀', text: 'Projects & Achievements', y: 1700 }
        ];

        ctx.textAlign = 'left';
        sections.forEach(section => {
            // Icon
            ctx.font = '80px Arial';
            ctx.fillText(section.icon, 200, section.y);

            // Text
            ctx.font = '60px Arial, sans-serif';
            ctx.fillStyle = '#555555';
            ctx.fillText(section.text, 350, section.y);

            // Underline
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(200, section.y + 30);
            ctx.lineTo(canvas.width - 200, section.y + 30);
            ctx.stroke();
        });

        // Footer
        ctx.textAlign = 'center';
        ctx.font = 'bold 70px Arial, sans-serif';
        ctx.fillStyle = '#667eea';
        ctx.fillText('SH.SH', canvas.width / 2, canvas.height - 200);

        ctx.font = '50px Arial, sans-serif';
        ctx.fillStyle = '#999999';
        ctx.fillText('Professional Developer', canvas.width / 2, canvas.height - 120);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        resolve(texture);
    });
}

/**
 * Alternative: Load an image preview of the PDF
 */
export async function loadImageAsTexture(imagePath) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(
            imagePath,
            (texture) => {
                texture.needsUpdate = true;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                resolve(texture);
            },
            undefined,
            (error) => {
                console.error('Error loading texture:', error);
                reject(error);
            }
        );
    });
}
