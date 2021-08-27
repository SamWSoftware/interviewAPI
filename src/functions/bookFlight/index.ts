import { APIGatewayProxyEvent } from 'aws-lambda';
import APIResponses from 'src/common/APIResponses';
import Dynamo from 'src/common/Dynamo';
import { Flight } from 'src/types/flights';

const handler = async (event: APIGatewayProxyEvent) => {
    try {
        const body = JSON.parse(event.body!);
        const { flightID, passengers } = body;
        await bookFlight({ flightID, passengers });
        return APIResponses._200({ message: 'flight successfully booked' });
    } catch (error) {
        return APIResponses._500(error.message);
    }
};
exports.handler = handler;
export default handler;

const bookFlight = async ({ flightID, passengers }: { flightID: string; passengers: number }) => {
    const flight = await Dynamo.get<Flight>({
        tableName: process.env.singleTable,
        hashKey: 'id',
        hashValue: flightID,
    });
    await Dynamo.write({
        data: { ...flight, passengers: flight.passengers + passengers },
        tableName: process.env.singleTable,
    });
    return;
};
