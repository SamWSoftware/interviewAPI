import { APIGatewayProxyEvent } from 'aws-lambda';
import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { Flight, Passenger } from 'src/types/flights';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = JSON.parse(event.body!);
    const { flightID } = event.pathParameters;
    const { passengers } = body;
    await bookFlight({ flightID, passengers });
    return formatJSONResponse({ body: { message: 'flight successfully booked' } });
  } catch (error) {
    return formatJSONResponse({ statusCode: 500, body: error.message });
  }
};

const bookFlight = async ({
  flightID,
  passengers,
}: {
  flightID: string;
  passengers: Passenger[];
}) => {
  const flight = await Dynamo.get<Flight>({
    tableName: process.env.singleTable,
    pkValue: flightID,
  });
  await Dynamo.write({
    data: { ...flight, passengers: [...flight.passengers, ...passengers] },
    tableName: process.env.singleTable,
  });
  return;
};
