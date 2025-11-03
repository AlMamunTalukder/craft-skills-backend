import AppError from '../../errors/AppError';
import type { RegisterParticipantDto } from './seminar.dto';
import type { IParticipant, ISeminar } from './seminar.interface';
import { Participant, Seminar } from './seminar.model';

const createSeminar = async (seminarData: ISeminar): Promise<ISeminar> => {
    const seminar = new Seminar(seminarData);
    await seminar.save();
    return seminar;
};

const getAllSeminars = async (): Promise<ISeminar[]> => {
    const seminars = await Seminar.find().populate('participants');
    return seminars;
};

const getSeminarById = async (id: string): Promise<ISeminar> => {
    const seminar = await Seminar.findById(id).populate('participants');
    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
    return seminar;
};

const updateSeminar = async (id: string, seminarData: Partial<ISeminar>): Promise<ISeminar> => {
    const seminar = await Seminar.findByIdAndUpdate(id, seminarData, {
        new: true,
    });
    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
    return seminar;
};

const deleteSeminar = async (id: string): Promise<ISeminar> => {
    const seminar = await Seminar.findByIdAndDelete(id);
    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
    return seminar;
};

const changeStatus = async (id: string, isActive: boolean): Promise<ISeminar> => {
    const seminar = await Seminar.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!seminar) {
        throw new AppError(404, 'Seminar not found');
    }
    return seminar;
};

const registerParticipant = async (
    participantData: RegisterParticipantDto,
): Promise<IParticipant> => {
    const seminar = await Seminar.findOne({
        isActive: true,
        registrationDeadline: { $gte: new Date() },
    });
    if (!seminar) {
        throw new AppError(404, 'Something went wrong! Please try again later.');
    }

    const participant = new Participant({
        ...participantData,
        seminarId: seminar._id,
    });
    await participant.save();

    seminar.participants?.push(participant._id);
    await seminar.save();

    return participant;
};

const seminarService = {
    createSeminar,
    getAllSeminars,
    getSeminarById,
    updateSeminar,
    deleteSeminar,
    registerParticipant,
    changeStatus,
};

export default seminarService;
