const AWS = require('aws-sdk');

AWS
    .config
    .update({accessKeyId: process.env.AWS_KEY, secretAccessKey: process.env.AWS_SECRET});

AWS
    .config
    .update({region: "us-west-1", endpoint: "dynamodb.us-west-1.amazonaws.com"});

exports.handler = function (context, event, callback) {

    // here we need to find the phone_number of the educator who's class just got
    // funded. then we can send that as the input to our educator flow so the flow
    // can send the educator a message letting them know a funding event occurred.
    // we need to know: educator's id set event_type = notification set class_name
    // set amount set funding_type

    let customer = event.data.object.customer;
    var amount = 0.0;
    var class_name = "";
    var event_type = "notification";
    var funding_type = "";
    if (event.type === 'order.payment_succeeded') {
        amount = (parseInt(event.data.object.amount) - parseInt(event.data.object.application_fee)) / 100;
        class_name = event.data.object.items[0].description;
        funding_type = 'one-time';
        console.log("Congratulations!  Someone provided class " + class_name + " with a one-time gift of $" + amount + " after fees which is on the way to your bank account!");
    } else {
        funding_type = 'subscription';
        amount = (parseInt(event.data.object.amount_paid) - parseInt(event.data.object.application_fee)) / 100;
        class_name = event
            .data
            .object
            .lines
            .data[0]
            .description
            .slice(4);
        console.log("Congratulations!  Someone subscribed to class " + class_name + ".  You recieve $" + amount + " each month after fees which is on the way to your bank account!");
    }

    var docClient = new AWS
        .DynamoDB
        .DocumentClient();

    var params = {
        TableName: "shared_customers",
        IndexName: "shared_account-index",
        KeyConditionExpression: "shared_account = :account",
        ExpressionAttributeValues: {
            ":account": customer
        }
    };

    let fetchBySharedCustomerPromise = docClient
        .query(params)
        .promise();

    fetchBySharedCustomerPromise.then((data) => {

        console.log(data.Items.length + " entities returned.");
        let shared_customer = data.Items[0];
        console.log(shared_customer);
        console.log("Found educator_account:" + shared_customer.educator_account);
        return shared_customer.educator_account;

    }).then((account) => {
        console.log("account:");
        console.log(account);
        let get_params = {
            TableName: "educators",
            IndexName: "stripe_account-index",
            KeyConditionExpression: "stripe_account = :account",
            ExpressionAttributeValues: {
                ":account": account
            }
        };

        let fetchEducatorAccountPromise = docClient
            .query(get_params)
            .promise();

        fetchEducatorAccountPromise.then((query_results) => {
            let educator = query_results.Items[0];
            console.log(educator.phone_number);
            console.log(amount.toFixed(2));
            console.log(class_name);
            console.log(event_type);
            console.log(funding_type);
            const client = context.getTwilioClient();

            client
                .studio
                .flows("FW6b556df4e8ac24a46c3fe112bf005d7d")
                .executions
                .create({
                    to: educator.phone_number,
                    from: "+18552171927",
                    parameters: {
                        event_type: event_type,
                        amount: amount.toFixed(2),
                        class_name: class_name,
                        funding_type: funding_type
                    }
                })
                .then(execution => {
                    console.log("execution.sid");
                    console.log(execution.sid);
                    callback(null, null);
                })
                .done();
        });
    });
};