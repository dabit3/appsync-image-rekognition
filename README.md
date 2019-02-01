# AppSync Image Rekognition

React app for AI image facial recognition processing.

![](https://i.imgur.com/pL4gveo.jpg)

## Getting started

0. Clone the project & change into the new directory

```sh
git clone https://github.com/dabit3/appsync-image-rekognition.git

cd appsync-image-rekognition
```

1. Install dependencies 

```sh
npm install
```

2. Initialize a new AWS Amplify project

```sh
amplify init
```

3. Add auth, storage, & AppSync services

```sh
amplify add auth

amplify add api

amplify add storage

amplify add function

amplify push
```

4. Update the AppSync Schema in your dashboard to the following:

```graphql
type ImageData {
	data: String!
}

type Query {
	fetchImage(imageInfo: String!): ImageData
}
```

5. Add the new Lambda function as a data source in the AppSync API Datasources section.

6. Update the `fetchImage` resolver data source to use the new Lambda function as the datasource. Update the `fetchImage` resolver to the following:

##### Request mapping template
```js
{
    "version" : "2017-02-28",
    "operation": "Invoke",
    "payload": $util.toJson($context.args)
}
```

##### Response mapping template
```js
$util.toJson($context.result)
```

7. Update the Lambda function code to the following (make sure to replace the bucket name with your bucket name):

```js
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
```

8. Add permissions to Lambda role for Rekognition as well as S3