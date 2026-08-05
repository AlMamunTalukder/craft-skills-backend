"use strict";
// server/services/coursebatch.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseBatchService = void 0;
const coursebatch_model_1 = require("./coursebatch.model");
const toResponseDto = (batch) => ({
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
const getAllBatches = async () => {
    const batches = await coursebatch_model_1.CourseBatch.find()
        .select('name code description registrationStart registrationEnd isActive facebookSecretGroup messengerSecretGroup createdAt updatedAt')
        .sort({ createdAt: -1 })
        .lean();
    return batches.map(toResponseDto);
};
// Get batch by ID
const getBatchById = async (id) => {
    const batch = await coursebatch_model_1.CourseBatch.findById(id).lean();
    if (!batch)
        throw new Error('Batch not found');
    return toResponseDto(batch);
};
// Create new batch
const createBatch = async (createDto) => {
    // Convert date strings to Date objects
    const batchData = {
        ...createDto,
        registrationStart: new Date(createDto.registrationStart),
        registrationEnd: new Date(createDto.registrationEnd),
    };
    const batch = new coursebatch_model_1.CourseBatch(batchData);
    const savedBatch = await batch.save();
    return toResponseDto(savedBatch.toObject());
};
// Update batch
const updateBatch = async (id, updateDto) => {
    // Convert date strings to Date objects if provided
    const updateData = { ...updateDto };
    if (updateDto.registrationStart) {
        updateData.registrationStart = new Date(updateDto.registrationStart);
    }
    if (updateDto.registrationEnd) {
        updateData.registrationEnd = new Date(updateDto.registrationEnd);
    }
    const batch = await coursebatch_model_1.CourseBatch.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        lean: true,
    });
    if (!batch)
        throw new Error('Batch not found');
    return toResponseDto(batch);
};
// Delete batch
const deleteBatch = async (id) => {
    const batch = await coursebatch_model_1.CourseBatch.findByIdAndDelete(id);
    if (!batch)
        throw new Error('Batch not found');
};
// Change batch status
const changeStatus = async (id, isActive) => {
    // If activating a batch, deactivate all others
    if (isActive) {
        await coursebatch_model_1.CourseBatch.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const batch = await coursebatch_model_1.CourseBatch.findByIdAndUpdate(id, { isActive }, { new: true, lean: true });
    if (!batch)
        throw new Error('Batch not found');
    return toResponseDto(batch);
};
// Get active batch
const getActiveBatch = async () => {
    const batch = await coursebatch_model_1.CourseBatch.findOne({ isActive: true }).lean();
    if (!batch)
        return null;
    return toResponseDto(batch);
};
const checkBatchExists = async (batchNumber) => {
    try {
        // Check by batch code or name
        const batch = await coursebatch_model_1.CourseBatch.findOne({
            $or: [{ code: batchNumber }, { name: batchNumber }],
        }).lean();
        return !!batch;
    }
    catch (error) {
        console.error('Error checking batch existence:', error);
        return false;
    }
};
exports.courseBatchService = {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    changeStatus,
    getActiveBatch,
    checkBatchExists,
};
