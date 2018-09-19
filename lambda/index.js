const AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})
var rekognition = new AWS.Rekognition()

exports.handler = (event, context, callback) => {
  var params = {
    Image: {
      S3Object: {
      Bucket: "<YOURBUCKETNAME>", 
      Name: "public/" + event.imageInfo
      }
    }, 
    Attributes: [
      'ALL'
    ]
  };
 
  rekognition.detectFaces(params, function(err, data) {
   if (err) {
    callback(null, {
     data: JSON.stringify(err.stack)
    })
   } else {
    const myData = JSON.stringify(data)
    callback(null, {
        data: myData
    })
   }
 });
};
