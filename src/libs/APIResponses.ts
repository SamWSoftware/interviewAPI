interface APIGatewayResponse {
  body: string;
  statusCode: number;
  headers?: { [key: string]: string };
}

export const formatJSONResponse = ({
  body,
  statusCode = 200,
  headers,
}: {
  body: any;
  statusCode?: number;
  headers?: { [key: string]: string };
}) =>
  ({
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
    statusCode,
    body: JSON.stringify(body),
  } as APIGatewayResponse);
