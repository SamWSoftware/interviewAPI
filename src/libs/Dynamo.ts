import { AttributeValue, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  DeleteCommand,
  DeleteCommandInput,
  GetCommand,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});

type Item = Record<string, AttributeValue>;

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

const Dynamo = {
  get: async <T = Item>({
    pkKey = 'id',
    pkValue,
    skKey,
    skValue,
    tableName,
  }: {
    pkKey?: string;
    pkValue: string;
    skKey?: string;
    skValue?: string;
    tableName: string;
  }) => {
    const params = {
      TableName: tableName,
      Key: {
        [pkKey]: pkValue,
      },
    };
    if (skKey && skValue) {
      params.Key[skKey] = skValue;
    }

    const res = await ddbClient.send(new GetCommand(params));

    return res.Item as T;
  },
  write: async <T = Item>({
    data,
    tableName,
  }: {
    data: { [key: string]: any };
    tableName: string;
  }) => {
    const params: PutCommandInput = {
      TableName: tableName,
      Item: { ...data },
    };
    await ddbClient.send(new PutCommand(params));
    return params.Item as T;
  },
  delete: async ({
    pkKey = 'id',
    pkValue,
    skKey,
    skValue,
    tableName,
  }: {
    pkKey?: string;
    pkValue: string;
    skKey?: string;
    skValue?: string;
    tableName: string;
  }) => {
    const params = {
      TableName: tableName,
      Key: {
        [pkKey]: pkValue,
      },
      ExpressionAttributeNames: {
        '#pkKey': pkKey,
      },
      ExpressionAttributeValues: {
        ':pkValue': pkValue,
      },
      ConditionExpression: `#pkKey = :pkValue`,
    };
    if (skKey && skValue) {
      params.Key[skKey] = skValue;
    }

    return await ddbClient.send(new DeleteCommand(params));
  },
  query: async <T = Item>({
    tableName,
    index,
    pkKey = 'pk',
    pkValue,
    skKey,
    skMin,
    skValue,
    skMax,
    skBeginsWith,
    limit,
    startFromRecord,
  }: {
    tableName: string;
    index: string;

    pkKey?: string;
    pkValue: string;
    skKey?: string;
    skValue?: string;
    skMin?: number | string;
    skMax?: number | string;
    skBeginsWith?: string;
    limit?: number;
    startFromRecord?: Record<string, string>;
  }) => {
    if (skKey && !(skMin || skMax || skValue || skBeginsWith)) {
      throw Error(
        'Need a skMin, skMax, skBeginsWith or skValue when a skKey is provided'
      );
    }

    const skminExp = skMin ? `${skKey} > :skvaluemin` : '';
    const skmaxExp = skMax ? `${skKey} < :skvaluemax` : '';
    const skEqualsExp = skValue ? `${skKey} = :skkeyvalue` : '';
    const skBeginsWithExp = skBeginsWith ? `begins_with (${skKey}, :skBeginsWith)` : '';

    const skKeyExp =
      skMin && skMax
        ? `${skKey} BETWEEN :skvaluemin AND :skvaluemax`
        : skminExp || skmaxExp || skEqualsExp || skBeginsWithExp;

    let params: QueryCommandInput = {
      TableName: tableName,
      IndexName: index,
      KeyConditionExpression: `${pkKey} = :pkvalue${skKey ? ` AND ${skKeyExp}` : ''}`,
      ExpressionAttributeValues: {
        ':pkvalue': pkValue,
      },
      Limit: limit,
      ExclusiveStartKey: startFromRecord ? startFromRecord : undefined,
    };

    if (!skKey) {
      delete params.ExpressionAttributeValues[':skvaluemax'];
      delete params.ExpressionAttributeValues[':skvaluemin'];
    } else {
      if (skMin) {
        params.ExpressionAttributeValues[':skvaluemin'] = skMin;
      }
      if (skMax) {
        params.ExpressionAttributeValues[':skvaluemax'] = skMax;
      }
      if (skValue) {
        params.ExpressionAttributeValues[':skkeyvalue'] = skValue;
      }
      if (skBeginsWith) {
        params.ExpressionAttributeValues[':skBeginsWith'] = skBeginsWith;
      }
    }

    const command = new QueryCommand(params);
    const res = await ddbClient.send(command);

    return res.Items as T[];
  },
  update: async ({
    tableName,
    pkKey,
    pkValue,
    skKey,
    skValue,
    updateKey,
    updateValue,
  }: {
    tableName: string;
    pkKey: string;
    pkValue: string;
    skKey?: string;
    skValue?: string;
    updateKey: string;
    updateValue: string;
  }) => {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: { [pkKey]: pkValue },
      UpdateExpression: `set #updateKey = :updateValue`,
      ExpressionAttributeValues: {
        ':updateValue': updateValue,
        ':pkValue': pkValue,
      },
      ExpressionAttributeNames: {
        '#updateKey': updateKey,
        '#pkKey': pkKey,
      },
      ReturnValues: 'ALL_NEW',
      ConditionExpression: `#pkKey = :pkValue`,
    };
    if (skKey && skValue) {
      params.Key[skKey] = skValue;
    }

    const res = await ddbClient.send(new UpdateCommand(params));

    return res.Attributes;
  },

  batchWrite: async ({
    tableName,
    tableData,
  }: {
    tableName: string;
    tableData: any[];
  }) => {
    const formattedRequestItems = tableData.map((item) => ({
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

    const params: BatchWriteCommandInput = {
      RequestItems: {
        [tableName]: batch,
      },
    };

    await ddbClient.send(new BatchWriteCommand(params));
  }
  return;
};
