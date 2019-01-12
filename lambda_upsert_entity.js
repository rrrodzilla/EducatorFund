const AWS = require('aws-sdk');

AWS
    .config
    .update({accessKeyId: process.env.AWS_KEY, secretAccessKey: process.env.AWS_SECRET});

AWS
    .config
    .update({region: "us-west-1"});

exports.handler = async(event) => {
    var bod;
    event
        .Records
        .forEach(record => {
            const {body} = record;
            let msg_obj = JSON.parse(body);
            console.log("HERE COMES THE LOCATION!");
            console.log(msg_obj);
            console.log("lat: " + msg_obj.params.lat);
            console.log("lon: " + msg_obj.params.lon);
            bod = body;
            let entity = msg_obj.entity;
            let entityKey = msg_obj.key;
            let params = msg_obj.params;

            let update_expression = "SET ";
            let expression_attribute_names = {};
            let expression_attribute_values = {};

            let current_element = 0;

            Object
                .keys(msg_obj.params)
                .forEach((key) => {
                    current_element++;
                    let comma = (current_element === Object.keys(params).length)
                        ? ""
                        : ", ";
                    update_expression = update_expression.concat("#" + key + " = :" + key + comma);
                    expression_attribute_names["#" + key] = key;
                    expression_attribute_values[":" + key] = params[key];
                })
            console.log(update_expression);
            console.log(expression_attribute_names);
            console.log(expression_attribute_values);

            //look for empty or null inputs
            if (entity === null || entity === "") {
                //callback("Sent empty entity;", null);
            } else {
                entity = entity.trim();
            }

            var docClient = new AWS
                .DynamoDB
                .DocumentClient({convertEmptyValues: true, endpoint: "dynamodb.us-west-1.amazonaws.com"});
            console.log(entity);
            console.log(entityKey);

            var db_params = {
                TableName: entity,
                Key: entityKey,
                "UpdateExpression": update_expression,
                "ExpressionAttributeNames": expression_attribute_names,
                "ExpressionAttributeValues": expression_attribute_values,
                "ReturnValues": "ALL_NEW"
            };

            console.log('executing updateObjectPromise');
            await docClient
                .update(db_params)
                .promise()
                .then((item) => {
                    console.log(entity + " inserted");
                    console.log(item);
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify(item)
                    };
                    return response;
                })
                .catch((error) => {
                    console.log("ERROR: ");
                    console.log(error);
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify(error)
                    };
                    return response;
                });

        });
    // const response = {     statusCode: 200,     body: JSON.stringify(bod + " and
    // hello from me!") }; return response;
};
