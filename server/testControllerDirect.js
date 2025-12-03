const articleController = require('./controllers/articleController');

async function testController() {
    console.log('Testing articleController.getArticles directly...\n');

    // Mock request and response objects
    const mockReq = {
        query: {
            page: 1,
            limit: 3
        }
    };

    const mockRes = {
        json: function (data) {
            console.log('✅ SUCCESS! Response:');
            console.log(JSON.stringify(data, null, 2));
            process.exit(0);
        },
        status: function (code) {
            console.log(`Status code: ${code}`);
            return this;
        }
    };

    try {
        await articleController.getArticles(mockReq, mockRes);
    } catch (error) {
        console.error('❌ Controller error:', error);
        process.exit(1);
    }
}

testController();
