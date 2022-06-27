import { APIGatewayProxyEvent } from 'aws-lambda';
import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const { origin, destination, fromDate, toDate } = event.queryStringParameters;
    if (!origin || !destination || !fromDate || !toDate) {
      return formatJSONResponse({
        statusCode: 500,
        body: { message: 'missing query string parameters' },
      });
    }

    const flights = await getFlights({ origin, destination, fromDate, toDate });
    return formatJSONResponse({ body: flights });
  } catch (error) {
    console.error(error);
    return formatJSONResponse({ statusCode: 500, body: error.message });
  }
};

const getFlights = async ({
  origin,
  destination,
  fromDate,
  toDate,
}: {
  origin: string;
  destination: string;
  fromDate: string;
  toDate: string;
}) => {
  return Dynamo.query({
    tableName: process.env.singleTable,
    index: 'index1',
    pkKey: 'pk',
    pkValue: 'flight',
    skKey: 'sk',
    skMin: `${origin}-${destination}-${fromDate}`,
    skMax: `${origin}-${destination}-${toDate}`,
  });
};
