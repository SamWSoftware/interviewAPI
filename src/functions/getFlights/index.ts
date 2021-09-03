import { APIGatewayProxyEvent } from 'aws-lambda';
import APIResponses from 'src/common/APIResponses';
import Dynamo from 'src/common/Dynamo';

const handler = async (event: APIGatewayProxyEvent) => {
    try {
        const { origin, destination, fromDate, toDate } = event.queryStringParameters;
        if (!origin || !destination || !fromDate || !toDate) {
            return APIResponses._400(Error('missing query string parameter/s'));
        }

        const flights = await getFlights({ origin, destination, fromDate, toDate });
        return APIResponses._200(flights);
    } catch (error) {
        console.error(error);
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
    fromDate: string;
    toDate: string;
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
