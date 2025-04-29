/**
 * IMPORTANT: RESTART SERVICES TO APPLY CHANGES
 * 
 * The payload size limits have been increased to allow for larger image uploads.
 * Both the Restaurant Service and API Gateway need to be restarted to apply these changes.
 * 
 * How to restart the services:
 * 
 * 1. Stop all running services (Ctrl+C in their terminal windows)
 * 
 * 2. Restart the Restaurant Service:
 *    cd food-delivery-system/services/restaurant-service
 *    npm start
 * 
 * 3. Restart the API Gateway:
 *    cd food-delivery-system/api-gateway
 *    npm start
 * 
 * 4. Refresh your browser to ensure the changes take effect
 * 
 * These changes will allow uploading images up to 50MB in size, though
 * we recommend keeping images under 5MB for optimal performance.
 */

console.log('\x1b[36m%s\x1b[0m', '========================================');
console.log('\x1b[36m%s\x1b[0m', '  RESTART SERVICES TO APPLY CHANGES');
console.log('\x1b[36m%s\x1b[0m', '========================================');
console.log('\x1b[33m%s\x1b[0m', 'The payload size limits have been increased to allow for larger image uploads.');
console.log('\x1b[33m%s\x1b[0m', 'Both the Restaurant Service and API Gateway need to be restarted.');
console.log('\x1b[0m');
console.log('\x1b[32m%s\x1b[0m', '1. Stop all running services (Ctrl+C in their terminal windows)');
console.log('\x1b[0m');
console.log('\x1b[32m%s\x1b[0m', '2. Restart the Restaurant Service:');
console.log('   cd food-delivery-system/services/restaurant-service');
console.log('   npm start');
console.log('\x1b[0m');
console.log('\x1b[32m%s\x1b[0m', '3. Restart the API Gateway:');
console.log('   cd food-delivery-system/api-gateway');
console.log('   npm start');
console.log('\x1b[0m');
console.log('\x1b[32m%s\x1b[0m', '4. Refresh your browser to ensure the changes take effect');
console.log('\x1b[0m');
console.log('\x1b[33m%s\x1b[0m', 'These changes will allow uploading images up to 50MB in size,');
console.log('\x1b[33m%s\x1b[0m', 'though we recommend keeping images under 5MB for optimal performance.');
console.log('\x1b[36m%s\x1b[0m', '========================================'); 