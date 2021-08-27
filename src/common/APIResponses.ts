interface APIGatewayResponse {
    body: string;
    statusCode: number;
    headers?: { [key: string]: string };
}

export const preAddHeaders = ({
    body,
    statusCode,
    headers,
}: {
    body: string;
    statusCode: number;
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
        body,
    } as APIGatewayResponse);

const _200 = (data: any = {}, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: JSON.stringify(data), statusCode: 200, headers });
};
const _201 = (data: any = {}, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: JSON.stringify(data), statusCode: 201, headers });
};
const _204 = (data: any = {}, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: JSON.stringify(data), statusCode: 204, headers });
};
/** bad request */
const _400 = (error: Error, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: error.message, statusCode: 400, headers });
};
/** unauthorised */
const _401 = (error: Error, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: error.message, statusCode: 401, headers });
};
const _404 = (error: Error, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: error.message, statusCode: 404, headers });
};
const _405 = (error: Error, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: error.message, statusCode: 405, headers });
};

const _500 = (error: Error, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: error.message, statusCode: 500, headers });
};
const _502 = (error: Error, headers?: { [key: string]: string }) => {
    return preAddHeaders({ body: error.message, statusCode: 502, headers });
};

const APIResponses = {
    _200,
    _201,
    _204,
    _400,
    _401,
    _404,
    _405,
    _500,
    _502,
};
export default APIResponses;
