import { S3CreateEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as csv from 'csvtojson';
import Dynamo from '@libs/Dynamo';
import { v4 as uuid } from 'uuid';
const S3 = new AWS.S3();

export const handler = async (event: S3CreateEvent) => {
  const files = event.Records.map((record) => ({
    key: record.s3.object.key,
    bucket: record.s3.bucket.name,
  }));
  try {
    await Promise.all(files.map(processCsv));
  } catch (error) {
    console.error(error);
  }
  return;
};

const processCsv = async ({ key, bucket }: { key: string; bucket: string }) => {
  const stream = S3.getObject({ Key: key, Bucket: bucket }).createReadStream();
  const products = (await csv().fromStream(stream)) as ProductCSV[];

  const colorData: Record<string, ColorRecord> = {};

  const newProductData = products.map((productCSV) => {
    if (!colorData[productCSV.color]) {
      const newColor: ColorRecord = {
        id: uuid(),
        name: productCSV.color,
      };
      colorData[productCSV.color] = newColor;
    }

    const { category, manufacturer, color, ...requiredProductFields } = productCSV;

    const product: ProductDynamo = {
      ...requiredProductFields,
      pk: `product`,
      sk: `category#${category}#manufacturer#${manufacturer}`,
      color: colorData[productCSV.color],
    };
    return product;
  });

  await Dynamo.batchWrite({
    tableName: process.env.singleTable,
    tableData: newProductData,
  });
};

interface ProductCSV {
  id: string;
  name: string;
  color: string;
  price: number;
  category: string;
  manufacturer: string;
}

interface ProductDynamo {
  id: string;
  pk: string;
  sk: string;

  name: string;
  color: ColorRecord;
  price: number;
}

interface ColorRecord {
  id: string;
  name: string;
}
