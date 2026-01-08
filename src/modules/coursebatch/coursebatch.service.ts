/* eslint-disable no-console */
// server/services/coursebatch.service.ts

import type { CreateBatchDto, UpdateBatchDto } from './coursebatch.dto';
import { CourseBatch } from './coursebatch.model';

interface CourseBatchResponse {
    _id: string;
    name: string;
    code: string;
    description: string;
    registrationStart: Date;
    registrationEnd: Date;
    isActive: boolean;
    facebookSecretGroup: string;
    messengerSecretGroup: string;
    createdAt: Date;
    updatedAt: Date;
}

const toResponseDto = (batch: any): CourseBatchResponse => ({
    _id: batch._id.toString(),
    name: batch.name,
    code: batch.code,
    description: batch.description || '',
    registrationStart: batch.registrationStart,
    registrationEnd: batch.registrationEnd,
    isActive: batch.isActive,
    facebookSecretGroup: batch.facebookSecretGroup || '',
    messengerSecretGroup: batch.messengerSecretGroup || '',
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
});

// Get all batches
const getAllBatches = async (): Promise<CourseBatchResponse[]> => {
    const batches = await CourseBatch.find()
        .select(
            'name code description registrationStart registrationEnd isActive facebookSecretGroup messengerSecretGroup createdAt updatedAt',
        )
        .sort({ createdAt: -1 })
        .lean();

    return batches.map(toResponseDto);
};

// Get batch by ID
const getBatchById = async (id: string): Promise<CourseBatchResponse> => {
    const batch = await CourseBatch.findById(id).lean();
    if (!batch) throw new Error('Batch not found');
    return toResponseDto(batch);
};

// Create new batch
const createBatch = async (createDto: CreateBatchDto): Promise<CourseBatchResponse> => {
    // Convert date strings to Date objects
    const batchData = {
        ...createDto,
        registrationStart: new Date(createDto.registrationStart),
        registrationEnd: new Date(createDto.registrationEnd),
    };

    const batch = new CourseBatch(batchData);
    const savedBatch = await batch.save();
    return toResponseDto(savedBatch.toObject());
};

// Update batch
const updateBatch = async (id: string, updateDto: UpdateBatchDto): Promise<CourseBatchResponse> => {
    // Convert date strings to Date objects if provided
    const updateData: any = { ...updateDto };

    if (updateDto.registrationStart) {
        updateData.registrationStart = new Date(updateDto.registrationStart);
    }

    if (updateDto.registrationEnd) {
        updateData.registrationEnd = new Date(updateDto.registrationEnd);
    }

    const batch = await CourseBatch.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        lean: true,
    });

    if (!batch) throw new Error('Batch not found');
    return toResponseDto(batch);
};

// Delete batch
const deleteBatch = async (id: string): Promise<void> => {
    const batch = await CourseBatch.findByIdAndDelete(id);
    if (!batch) throw new Error('Batch not found');
};

// Change batch status
const changeStatus = async (id: string, isActive: boolean): Promise<CourseBatchResponse> => {
    // If activating a batch, deactivate all others
    if (isActive) {
        await CourseBatch.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    const batch = await CourseBatch.findByIdAndUpdate(id, { isActive }, { new: true, lean: true });

    if (!batch) throw new Error('Batch not found');
    return toResponseDto(batch);
};

// Get active batch
const getActiveBatch = async (): Promise<CourseBatchResponse | null> => {
    const batch = await CourseBatch.findOne({ isActive: true }).lean();

    if (!batch) return null;
    return toResponseDto(batch);
};

const checkBatchExists = async (batchNumber: string): Promise<boolean> => {
    try {
        // Check by batch code or name
        const batch = await CourseBatch.findOne({
            $or: [{ code: batchNumber }, { name: batchNumber }],
        }).lean();

        return !!batch;
    } catch (error: any) {
        console.error('Error checking batch existence:', error);
        return false;
    }
};

export const courseBatchService = {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    changeStatus,
    getActiveBatch,
    checkBatchExists,
};
