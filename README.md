## Running this project locally

A lot of this project can be run locally using serverless-offline and a local dynamo DB instance.

### Install Dependencies

Run `npm i`
`npm i -g serverless`

### Dynamo Setup

-   ensure you have java engine installed on your machine [Get it here](https://www.oracle.com/java/technologies/javase-jre8-downloads.html)
-   run `sls dynamodb install`

### Running everything locally

To start the local API you just need to run `npm run offline`.

#### Testing

To test the get endpoint you can do a get request to this url

http://localhost:3000/dev/flights?origin=Saint%20Petersburg&destination=Bucharest&fromDate=1630073644000&toDate=1630073645000

to test the post flight you can post to

http://localhost:3000/dev/flights/b335c8cd-c9bd-4a21-8898-e1a885e2aec6
with the following body

```
{
    "passengers": [
        {"name": "test passenger"}
    ]
}
```

You can then retry the existing get request
