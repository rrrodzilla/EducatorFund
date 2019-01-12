exports.handler = function (context, event, callback) {
    console.log("Initiating Complete Purchase");
    const stripe = require('stripe')(context.STRIPE_SECRET_KEY);

    //gather our inputs
    let educator = event.educator;
    let customer = event.customer;
    let customer_email = event.customer_email;
    let donation_type = event
        .donation_type
        .trim();
    let amount = parseFloat(event.amount * 1.0) * 100;
    let classroom = event.classroom;

    //this is a one-time donation
    if (donation_type === "single") {
        let productId = "PROD" + classroom;
        console.log(productId);

        let skuId = "SKU_" + productId + amount;
        console.log(skuId);

        //now we have the sku, let's charge that mofo first create a shared customer
        stripe
            .orders
            .create({
                currency: "usd",
                items: [
                    {
                        parent: skuId,
                        description: "One-time donation"
                    }
                ],
                customer: customer
            }, {stripe_account: educator})
            .then((order) => {
                stripe
                    .orders
                    .pay(order.id, {
                        customer: customer,
                        application_fee: (amount * 0.12)
                    }, {stripe_account: educator})
                    .then((paid_order) => {
                        callback(null, order);
                    });
            });

    } else {
        let subscriptionId = "SUB" + classroom;
        console.log(subscriptionId);

        let skuId = "PP_" + subscriptionId + amount;
        console.log(skuId);

        stripe
            .subscriptions
            .create({
                customer: customer,
                items: [
                    {
                        plan: skuId
                    }
                ],
                application_fee_percent: 12
            }, {stripe_account: educator})
            .then((new_subscription) => {
                //this is a subscription
                callback(null, new_subscription);
            });
    }

};
