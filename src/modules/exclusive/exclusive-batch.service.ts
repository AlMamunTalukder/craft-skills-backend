import { ExclusiveBatch } from './exclusive-batch.model';
import type { CreateExclusiveBatchDto, UpdateExclusiveBatchDto } from './exclusive-batch.dto';

interface ExclusiveBatchResponse {
    _id: string;
    batchNo: string | number;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    offerPrice: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const toResponseDto = (batch: any): ExclusiveBatchResponse => ({
    _id: batch._id.toString(),
    batchNo: batch.batchNo,
    title: batch.title,
    description: batch.description || '',
    startDate: batch.startDate,
    endDate: batch.endDate,
    offerPrice: batch.offerPrice,
    isActive: batch.isActive,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
});

const getAllBatches = async (): Promise<ExclusiveBatchResponse[]> => {
    const batches = await ExclusiveBatch.find().sort({ batchNo: -1 }).lean();
    return batches.map(toResponseDto);
};

const getBatchById = async (id: string): Promise<ExclusiveBatchResponse> => {
    const batch = await ExclusiveBatch.findById(id).lean();
    if (!batch) throw new Error('Batch not found');
    return toResponseDto(batch);
};

const createBatch = async (createDto: CreateExclusiveBatchDto): Promise<ExclusiveBatchResponse> => {
    const batch = new ExclusiveBatch(createDto);
    const savedBatch = await batch.save();
    return toResponseDto(savedBatch.toObject());
};

const updateBatch = async (
    id: string,
    updateDto: UpdateExclusiveBatchDto,
): Promise<ExclusiveBatchResponse> => {
    const batch = await ExclusiveBatch.findByIdAndUpdate(id, updateDto, {
        new: true,
        runValidators: true,
        lean: true,
    });
    if (!batch) throw new Error('Batch not found');
    return toResponseDto(batch);
};

const deleteBatch = async (id: string): Promise<void> => {
    const batch = await ExclusiveBatch.findByIdAndDelete(id);
    if (!batch) throw new Error('Batch not found');
};

const toggleBatchStatus = async (
    id: string,
    isActive: boolean,
): Promise<ExclusiveBatchResponse> => {
    const batch = await ExclusiveBatch.findByIdAndUpdate(
        id,
        { isActive },
        { new: true, lean: true },
    );
    if (!batch) throw new Error('Batch not found');
    return toResponseDto(batch);
};

const getActiveBatch = async (): Promise<ExclusiveBatchResponse | null> => {
    const now = new Date();
    const batch = await ExclusiveBatch.findOne({
        isActive: true,
        endDate: { $gt: now }, // Use endDate as deadline
    })
        .sort({ batchNo: -1 })
        .lean();

    if (!batch) return null;
    return toResponseDto(batch);
};

export const exclusiveBatchService = {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    toggleBatchStatus,
    getActiveBatch,
};
