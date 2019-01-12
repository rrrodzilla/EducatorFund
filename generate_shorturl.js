function generatePath(path = '') {
    let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let position = Math.floor(Math.random() * characters.length)
    let character = characters.charAt(position)
    if (path.length === 10) {
        return path
    }
    return generatePath(path + character)
}

exports.handler = function (context, event, callback) {
    const AWS = require('aws-sdk');

    AWS
        .config
        .update({accessKeyId: process.env.AWS_KEY, secretAccessKey: process.env.AWS_SECRET, region: "us-west-1"});

    let originalUrl = "https://fandango-bulldog-9035.twil.io/handle-shortUrl?";
    let shortUrl = generatePath();

    let s3 = new AWS.S3();

    // call S3 to retrieve upload file to specified bucket
    var uploadParams = {
        Bucket: 'educatorfund.com',
        Key: 'sr/' + shortUrl,
        Body: '',
        ACL: 'public-read',
        WebsiteRedirectLocation: originalUrl + shortUrl
    };

    // call S3 to retrieve upload file to specified bucket
    let uploadPromise = s3
        .upload(uploadParams)
        .promise();

    uploadPromise.then((uploadedFile) => {
        console.log(uploadedFile);
        callback(null, {
            code: shortUrl,
            url: 'https://www.educatorfund.com/sr/' + shortUrl
        });
    }).catch((err, data) => {
        callback(err, null);
    });

};
