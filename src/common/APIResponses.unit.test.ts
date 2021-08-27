import testUtilities from '../../testUtilities';
import APIResponses, { errParamsToFormatted, preAddHeaders } from './APIResponses';

describe('API Responses tests', () => {
    test('errParamsToFormatted works with no params', () => {
        const errorBody = errParamsToFormatted({}, 400);

        expect(typeof errorBody.timestamp).toBe('number');
        const err = errorBody.errors[0];
        expect(err).toMatchObject({
            errorUuid: testUtilities.validation.isUUID(),
        });
    });

    test('set the error code', () => {
        const errorBody = errParamsToFormatted({ errorCode: 'NOT_ALLOWED_CHARACTERS' }, 400);

        expect(typeof errorBody.timestamp).toBe('number');
        const err = errorBody.errors[0];
        expect(err).toMatchObject({
            errorUuid: testUtilities.validation.isUUID(),
            errorCode: 'NOT_ALLOWED_CHARACTERS',
        });
    });

    test('set message and ref', () => {
        const errorBody = errParamsToFormatted(
            {
                message: 'this is a message',
                ref: 'this is a ref',
            },
            400
        );

        expect(typeof errorBody.timestamp).toBe('number');
        const err = errorBody.errors[0];
        expect(err).toMatchObject({
            errorUuid: testUtilities.validation.isUUID(),
            errorCode: 'UNEXPECTED_ERROR',
            message: 'this is a message',
            ref: 'this is a ref',
        });
    });

    test('set data', () => {
        const errorBody = errParamsToFormatted(
            {
                data: {
                    name: 'Jess',
                    age: 48,
                    job: { title: 'admin', groups: ['group1', 'other team'] },
                },
            },
            400
        );

        expect(typeof errorBody.timestamp).toBe('number');
        const err = errorBody.errors[0];
        expect(err).toMatchObject({
            errorUuid: testUtilities.validation.isUUID(),
            errorCode: 'UNEXPECTED_ERROR',
            data: {
                name: 'Jess',
                age: 48,
                job: { title: 'admin', groups: ['group1', 'other team'] },
            },
        });
    });

    test('test default error code overrides', () => {
        const errorBody = errParamsToFormatted({}, 404);

        expect(typeof errorBody.timestamp).toBe('number');
        const err = errorBody.errors[0];
        expect(err).toMatchObject({
            errorUuid: testUtilities.validation.isUUID(),
            errorCode: 'RESOURCE_NOT_FOUND',
        });
    });

    test('adding extra headers', () => {
        const error = preAddHeaders({
            body: JSON.stringify({ name: 'Sam' }),
            statusCode: 400,
            headers: { otherHeader: 'test' },
        });
        expect(error.headers.otherHeader).toBe('test');

        const fullRes = APIResponses._201(undefined, { moreHeaders: 'some_value' });
        expect(fullRes.headers['moreHeaders']).toBe('some_value');
    });
    test('overriding headers', () => {
        const error = preAddHeaders({
            body: JSON.stringify({ name: 'Sam' }),
            statusCode: 400,
            headers: { 'Access-Control-Allow-Methods': 'GET' },
        });
        expect(error.headers['Access-Control-Allow-Methods']).toBe('GET');

        const fullRes = APIResponses._201(undefined, { 'Content-Type': 'none' });
        expect(fullRes.headers['Content-Type']).toBe('none');
    });
});
