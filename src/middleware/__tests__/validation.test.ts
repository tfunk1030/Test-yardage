import { validateEnvironmentalConditions, validateClubData } from '../validation';
import { Request, Response, NextFunction } from 'express';

describe('Validation Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
    });

    describe('validateEnvironmentalConditions', () => {
        test('should pass valid environmental conditions', () => {
            mockRequest.body = {
                temperature: 70,
                pressure: 29.92,
                humidity: 50,
                windSpeed: 10,
                windDirection: 180,
                elevation: 0,
                groundHardness: 0.7
            };

            validateEnvironmentalConditions(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        test('should reject invalid temperature', () => {
            mockRequest.body = {
                temperature: -50,  // Too low
                pressure: 29.92,
                humidity: 50,
                windSpeed: 10,
                windDirection: 180
            };

            validateEnvironmentalConditions(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'temperature'
                        })
                    ])
                })
            );
        });

        test('should reject missing required fields', () => {
            mockRequest.body = {
                temperature: 70  // Missing other required fields
            };

            validateEnvironmentalConditions(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'pressure'
                        }),
                        expect.objectContaining({
                            field: 'humidity'
                        }),
                        expect.objectContaining({
                            field: 'windSpeed'
                        }),
                        expect.objectContaining({
                            field: 'windDirection'
                        })
                    ])
                })
            );
        });
    });

    describe('validateClubData', () => {
        test('should pass valid club data', () => {
            mockRequest.body = {
                type: 'driver',
                loft: 10.5,
                spinFactor: 1.0,
                quality: 1.0,
                impact: 'center'
            };

            validateClubData(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        test('should reject invalid loft', () => {
            mockRequest.body = {
                type: 'driver',
                loft: 70,  // Too high
                spinFactor: 1.0
            };

            validateClubData(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'loft'
                        })
                    ])
                })
            );
        });

        test('should reject invalid impact location', () => {
            mockRequest.body = {
                type: 'driver',
                loft: 10.5,
                spinFactor: 1.0,
                impact: 'invalid'  // Invalid impact location
            };

            validateClubData(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'impact'
                        })
                    ])
                })
            );
        });
    });
});
