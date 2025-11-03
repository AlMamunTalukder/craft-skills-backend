import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import seminarService from './seminar.service';

const createSeminar = catchAsync(async (req: Request, res: Response) => {
    const seminar = await seminarService.createSeminar(req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Seminar created successfully',
        data: seminar,
    });
});

const getAllSeminars = catchAsync(async (req: Request, res: Response) => {
    const seminars = await seminarService.getAllSeminars();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Seminars retrieved successfully',
        data: seminars,
    });
});

const getSeminarById = catchAsync(async (req: Request, res: Response) => {
    const seminar = await seminarService.getSeminarById(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Seminar retrieved successfully',
        data: seminar,
    });
});

const updateSeminar = catchAsync(async (req: Request, res: Response) => {
    const seminar = await seminarService.updateSeminar(req.params.id, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Seminar updated successfully',
        data: seminar,
    });
});

const deleteSeminar = catchAsync(async (req: Request, res: Response) => {
    await seminarService.deleteSeminar(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Seminar deleted successfully',
        data: null,
    });
});

const changeStatus = catchAsync(async (req: Request, res: Response) => {
    const seminar = await seminarService.changeStatus(req.params.id, req.body.isActive);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Seminar status updated successfully',
        data: seminar,
    });
});

const registerParticipant = catchAsync(async (req: Request, res: Response) => {
    const participant = await seminarService.registerParticipant(req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Participant registered successfully',
        data: participant,
    });
});

const seminarController = {
    createSeminar,
    getAllSeminars,
    getSeminarById,
    updateSeminar,
    deleteSeminar,
    registerParticipant,
    changeStatus,
};

export default seminarController;
