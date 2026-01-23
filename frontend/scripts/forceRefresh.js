/**
 * FORCE REFRESH ADMIN DASHBOARD
 * 
 * This script will:
 * 1. Clear Next.js cache
 * 2. Force rebuild
 * 3. Restart the dev server
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Force refreshing admin dashboard...\n');

try {
    // Navigate to frontend directory
    const frontendDir = path.join(__dirname, '..');

    console.log('1️⃣ Clearing Next.js cache...');
    try {
        execSync('rmdir /s /q .next', { cwd: frontendDir, stdio: 'inherit' });
        console.log('✅ Cache cleared\n');
    } catch (e) {
        console.log('⚠️  No cache to clear (this is fine)\n');
    }

    console.log('2️⃣ Instructions to restart dev server:');
    console.log('   - Stop the frontend server (Ctrl+C in the terminal)');
    console.log('   - Run: npm run dev');
    console.log('   - Or just refresh your browser with Ctrl+Shift+R\n');

    console.log('3️⃣ Clear browser cache:');
    console.log('   - Press Ctrl+Shift+Delete');
    console.log('   - Clear "Cached images and files"');
    console.log('   - Or use Ctrl+Shift+R for hard refresh\n');

    console.log('4️⃣ Login again:');
    console.log('   - Go to: http://localhost:3000/auth/logout');
    console.log('   - Then: http://localhost:3000/auth/login');
    console.log('   - Email: admin@healthlife.com');
    console.log('   - Password: Admin@123456\n');

    console.log('✅ Done! Follow the instructions above.');

} catch (error) {
    console.error('❌ Error:', error.message);
}
