// request is a module that makes http calls easier
const request = require('request');
const MongoClient = require('mongodb').MongoClient;

const db = 'mongodb://127.0.0.1:27017/';

const fetchFromAPI = (callback) => {
    request.get('https://api.coindesk.com/v1/bpi/historical/close.json', (err, raw, body) => {
        return callback(err, JSON.parse(body));
    });
};

const insertMongodb = (collection, data) => {
	const promisedInserts = [];

	Object.keys(data).forEach((key) => {
		promisedInserts.push(
			collection.insertOne({
				date: key,
				value: data[key]
			})
		);
	});
	return Promise.all(promisedInserts);
};

MongoClient.connect(db, { useNewUrlParser: true }, (err, client) => {
	var db = client.db('maxcoin');
	if (err) throw err;
	console.log("Successfully connected to MongoDB!");
	fetchFromAPI((err, data) => {
    	if (err) throw err;
    	const collection = db.collection('value');
    	insertMongodb(collection, data.bpi)
    		.then((result) => {
    			console.log(`Successfully inserted ${result.length} documents into MongoDB`);
    			const options = {
    				'sort': [['value', 'desc']]
    			};
    			collection.findOne({}, options, (err,doc) =>{
    				if(err) throw err;
    				console.log(`MongoDB: The one month maximum value is ${doc.value} and it was reached on ${doc.date}`)
    				client.close();
    			});
    		})
    		.catch((err) =>{
    			console.log(err);
    			process.exit();
    		})
	});
});
