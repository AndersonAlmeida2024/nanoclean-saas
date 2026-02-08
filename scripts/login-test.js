import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Load .env manually
const envPath = path.join(rootDir, '.env');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const parseEnv = (content) => {
        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (key === 'VITE_SUPABASE_URL') supabaseUrl = value;
                if (key === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value;
            }
        }
    };
    parseEnv(envContent);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase keys in .env or environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.log('⚠️  Usage: node scripts/login-test.js <email> <password>');
    console.log('   Running connectivity check only...');

    // Check if we can reach the server
    const start = Date.now();
    fetch(supabaseUrl).then(res => {
        console.log(`✅ Connectivity OK (${Date.now() - start}ms) - Status: ${res.status}`);
        console.log('   (404 is expected for root URL of some Supabase instances, proving reachability)');
    }).catch(err => {
        console.error('❌ Connectivity FAILED:', err.message);
    });

    // Try a dummy auth to check API response
    console.log('   Attempting dummy auth request to check endpoint...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'check@connectivity.com',
        password: 'dummy-password-123'
    });

    if (error) {
        if (error.message === 'Invalid login credentials') {
            console.log('✅ Auth API is Weilling & Responding (Got expected "Invalid login credentials")');
        } else {
            console.log(`⚠️  Auth API Match: ${error.message} (Status: ${error.status})`);
        }
    }
    process.exit(0);
}

console.log(`🔐 Attempting login for: ${email}`);
const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
});

if (error) {
    console.error('❌ Login Failed:', error.message);
    process.exit(1);
}

console.log('✅ Login Successful!');
console.log('   User ID:', data.user.id);
console.log('   Email:', data.user.email);
console.log('   Metadata:', data.user.user_metadata);
process.exit(0);
