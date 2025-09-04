const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('Production Environment Validation');
console.log('========================================\n');

// Check if production build exists
const buildPath = path.join(__dirname, 'dist', 'Library-Management-System-AI', 'browser');
if (fs.existsSync(buildPath)) {
    console.log('✓ Production build exists');
    
    // Check if index.html exists
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        console.log('✓ index.html found');
        
        // Read and check if it contains the correct base href
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        if (indexContent.includes('<base href="/">')) {
            console.log('✓ Base href is correctly set');
        } else {
            console.log('⚠ Base href might need adjustment');
        }
    } else {
        console.log('✗ index.html not found');
    }
} else {
    console.log('✗ Production build not found');
    console.log('  Run: npm run build:prod');
}

// Check environment configuration
const envPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
if (fs.existsSync(envPath)) {
    console.log('✓ Production environment file exists');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('benedictocollege-library.org')) {
        console.log('✓ Domain configured in production environment');
    } else {
        console.log('⚠ Domain not found in production environment');
    }
} else {
    console.log('✗ Production environment file not found');
}

// Check backend .env
const backendEnvPath = path.join(__dirname, 'backend-api', '.env');
if (fs.existsSync(backendEnvPath)) {
    console.log('✓ Backend .env file exists');
    
    const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
    if (backendEnvContent.includes('benedictocollege-library.org')) {
        console.log('✓ Domain configured in backend CORS');
    } else {
        console.log('⚠ Domain not found in backend CORS');
    }
} else {
    console.log('✗ Backend .env file not found');
}

console.log('\n========================================');
console.log('Validation complete');
console.log('========================================');
