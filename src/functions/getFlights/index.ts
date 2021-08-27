import { APIGatewayProxyEvent } from 'aws-lambda';
import APIResponses from 'src/common/APIResponses';
import Dynamo from 'src/common/Dynamo';

const handler = async (event: APIGatewayProxyEvent) => {
    try {
        const body = JSON.parse(event.body!);
        const { origin, destination, fromDate, toDate } = body;
        const flights = await getFlights({ origin, destination, fromDate, toDate });
        return APIResponses._200(flights);
    } catch (error) {
        return APIResponses._500(error.message);
    }
};
exports.handler = handler;
export default handler;

const getFlights = async ({
    origin,
    destination,
    fromDate,
    toDate,
}: {
    origin: string;
    destination: string;
    fromDate: number;
    toDate: number;
}) => {
    return Dynamo.query({
        tableName: process.env.singleTable,
        index: 'index1',
        hashKey: 'pk',
        hashValue: 'flight',
        rangeKey: 'sk',
        rangeMin: `${origin}-${destination}-${fromDate}`,
        rangeMax: `${origin}-${destination}-${toDate}`,
    });
};
