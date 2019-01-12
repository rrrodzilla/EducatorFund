exports.handler = function (context, event, callback) {

    const AWS = require('aws-sdk');

    AWS
        .config
        .update({accessKeyId: process.env.AWS_KEY, secretAccessKey: process.env.AWS_SECRET, region: "us-west-1"});

    var docClient = new AWS
        .DynamoDB
        .DocumentClient({endpoint: "dynamodb.us-west-1.amazonaws.com"});

    var params = {
        TableName: "shortUrls",
        Key: {
            urlCode: Object.keys(event)[0]
        }
    };

    docClient.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            callback("Item not found");
        } else {
            if (!Object.keys(data).length) {
                callback(null, null);
            } else {
                console.log("Get Item succeeded:", JSON.stringify(data.Item, null, 2));
                let response = new Twilio.Response();

                response.setStatusCode(301);
                response.appendHeader('Location', data.Item.url);
                console.log(Object.keys(event)[0]);
                console.log(data.Item);
                callback(null, response);
            }
        }
    });

};