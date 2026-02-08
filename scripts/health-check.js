import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

console.log('🔍 DevOps Health Check starting...');

// 1. Check Node Version
const nodeVersion = process.version;
console.log(`✅ Node Version: ${nodeVersion}`);

// 2. Check .env
const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ CRITICAL: .env file missing!');
    console.error('   Please copy .env.example to .env and fill in the values.');
    process.exit(1);
} else {
    console.log('✅ .env file present');
    // Simple check for content (not parsing values to avoid leaking secrets in logs)
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (!envContent.includes('VITE_SUPABASE_URL') || !envContent.includes('VITE_SUPABASE_ANON_KEY')) {
        console.error('❌ CRITICAL: .env file is missing Supabase keys (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY).');
        process.exit(1);
    }
}

// 3. Check node_modules
const nodeModulesPath = path.join(rootDir, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ CRITICAL: node_modules missing!');
    console.error('   Please run "npm install" before starting the server.');
    process.exit(1);
} else {
    console.log('✅ node_modules present');
}

console.log('🚀 Environment looks healthy. Starting server...');
process.exit(0);
