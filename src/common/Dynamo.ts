import * as AWS from 'aws-sdk';

import { AttributeMap, DocumentClient } from 'aws-sdk/clients/dynamodb';

const isTest = process.env.JEST_WORKER_ID;
const isServerlessOffline = process.env.IS_OFFLINE;
const config = {
    convertEmptyValues: true,
    region: process.env.region || 'eu-central-1',
    ...(isTest && {
        endpoint: 'http://localhost:8000',
        sslEnabled: false,
        region: 'local-env',
    }),
    ...(isServerlessOffline && {
        endpoint: 'http://localhost:8005',
    }),
};
const documentClient = new AWS.DynamoDB.DocumentClient(config);
const dynamo = new AWS.DynamoDB(config); //Need this for secondary key queries while we fix bug.

const Dynamo = {
    get: async <T = AttributeMap>({
        hashKey,
        hashValue,
        rangeKey,
        rangeValue,
        tableName,
    }: {
        hashKey: string;
        hashValue: string;
        rangeKey?: string;
        rangeValue?: string;
        tableName: string;
    }) => {
        const params = {
            TableName: tableName,
            Key: {
                [hashKey]: hashValue,
            },
        };
        if (rangeKey && rangeValue) {
            params.Key[rangeKey] = rangeValue;
        }

        const data = await documentClient.get(params).promise();
        return data.Item as T;
    },
    write: async <T = AttributeMap>({
        data,
        tableName,
    }: {
        data: { [key: string]: any };
        tableName: string;
    }) => {
        const params = {
            TableName: tableName,
            Item: { ...data },
        };
        await documentClient.put(params).promise();
        return { ...data } as unknown as T;
    },
    delete: async ({
        hashKey,
        hashValue,
        rangeKey,
        rangeValue,
        tableName,
    }: {
        hashKey: string;
        hashValue: string;
        rangeKey?: string;
        rangeValue?: string;
        tableName: string;
    }) => {
        const params = {
            TableName: tableName,
            Key: {
                [hashKey]: hashValue,
            },
            ExpressionAttributeNames: {
                '#hashKey': hashKey,
            },
            ExpressionAttributeValues: {
                ':hashValue': hashValue,
            },
            ConditionExpression: `#hashKey = :hashValue`,
        };
        if (rangeKey && rangeValue) {
            params.Key[rangeKey] = rangeValue;
        }

        return await documentClient.delete(params).promise();
    },
    query: async <T = AttributeMap>({
        index,
        hashKey,
        hashValue,
        rangeKey,
        rangeMin,
        rangeValue,
        rangeMax,
        tableName,
    }: {
        index: string;
        hashKey: string;
        hashValue: string;
        rangeKey?: string;
        rangeValue?: string;
        rangeMin?: number | string;
        rangeMax?: number | string;
        tableName: string;
    }) => {
        if (rangeKey && !(rangeMin || rangeMax || rangeValue)) {
            throw Error('Need a rangeMin or rangeMax when a range key is provided');
        }

        const rminExp = rangeMin ? `${rangeKey} > :rvaluemin` : '';
        const rmaxExp = rangeMax ? `${rangeKey} < :rvaluemax` : '';
        const rEqualsExp = rangeValue ? `${rangeKey} = :rkeyvalue` : '';

        const rKeyExp =
            rangeMin && rangeMax
                ? `${rangeKey} BETWEEN :rvaluemin AND :rvaluemax`
                : rminExp || rmaxExp || rEqualsExp;

        let params = {
            TableName: tableName,
            IndexName: index,
            KeyConditionExpression: `#hkey = :hvalue${rangeKey ? ` AND ${rKeyExp}` : ''}`,
            ExpressionAttributeValues: {
                ':hvalue': { S: hashValue },
            },
            ExpressionAttributeNames: {
                '#hkey': hashKey,
            },
        };

        if (!rangeKey) {
            delete params.ExpressionAttributeValues[':rvaluemax'];
            delete params.ExpressionAttributeValues[':rvaluemin'];
        } else {
            if (rangeMin) {
                params.ExpressionAttributeValues[':rvaluemin'] = { S: String(rangeMin) };
            }
            if (rangeMax) {
                params.ExpressionAttributeValues[':rvaluemax'] = { S: String(rangeMax) };
            }
            if (rangeValue) {
                params.ExpressionAttributeValues[':rkeyvalue'] = { S: String(rangeValue) };
            }
        }

        /*
        const res = await documentClient.query(params).promise()
        const items = res.Items;
        */

        const res = await dynamo.query(params).promise(); //documentClient was not working with GSI, had to use this for now.
        let items = res.Items?.map(item => {
            return AWS.DynamoDB.Converter.unmarshall(item);
        });
        return items as unknown as T[];
    },
    update: async ({
        tableName,
        hashKey,
        hashValue,
        rangeKey,
        rangeValue,
        updateKey,
        updateValue,
    }: {
        tableName: string;
        hashKey: string;
        hashValue: string;
        rangeKey?: string;
        rangeValue?: string;
        updateKey: string;
        updateValue: string;
    }) => {
        const params: DocumentClient.UpdateItemInput = {
            TableName: tableName,
            Key: { [hashKey]: hashValue },
            UpdateExpression: `set #updateKey = :updateValue`,
            ExpressionAttributeValues: {
                ':updateValue': updateValue,
                ':hashValue': hashValue,
            },
            ExpressionAttributeNames: {
                '#updateKey': updateKey,
                '#hashKey': hashKey,
            },
            ReturnValues: 'ALL_NEW',
            ConditionExpression: `#hashKey = :hashValue`,
        };
        if (rangeKey && rangeValue) {
            params.Key[rangeKey] = rangeValue;
        }

        return documentClient.update(params).promise();
    },

    batchWrite: async ({ tableName, tableData }: { tableName: string; tableData: any[] }) => {
        const formattedRequestItems = tableData.map(item => ({
            PutRequest: {
                Item: item,
            },
        }));

        return batch25(formattedRequestItems, tableName);
    },
};

export default Dynamo;

const batch25 = async (requests: any, tableName: string) => {
    let batchNo = 0;

    while (requests.length > 0) {
        batchNo += 1;
        console.log({ batchNo });
        const batch = requests.splice(0, 25);

        const params = {
            RequestItems: {
                [tableName]: batch,
            },
        };

        await documentClient.batchWrite(params).promise();
    }
    return;
};
