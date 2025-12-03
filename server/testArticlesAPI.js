const axios = require('axios');

async function testArticlesAPI() {
    try {
        console.log('Testing /api/articles...');
        const response = await axios.get('http://localhost:5000/api/articles?page=1&limit=3');
        console.log('✅ Success!');
        console.log('Status:', response.status);
        console.log('Data structure:', Object.keys(response.data));
        console.log('Articles count:', response.data.articles?.length);
        console.log('Pagination:', response.data.pagination);
        console.log('\nFirst article:', response.data.articles?.[0]?.title);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received');
            console.error('Request:', error.request);
        } else {
            console.error('Error details:', error);
        }
    }
}

testArticlesAPI();
