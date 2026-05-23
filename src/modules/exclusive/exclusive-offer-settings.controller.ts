import catchAsync from 'src/utils/catchAsync';
import sendResponse from 'src/utils/sendResponse';
import { ExclusiveOfferSettings } from './exclusive-offer-settings.model';

const getSettings = catchAsync(async (req, res) => {
  const settings = await ExclusiveOfferSettings.getSingleton();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: settings,
  });
});

const updateSettings = catchAsync(async (req, res) => {
  const { isActive, deadline, courseTitle, regularPrice, offerPrice, description } = req.body;
  let settings = await ExclusiveOfferSettings.getSingleton();
  
  if (isActive !== undefined) settings.isActive = isActive;
  if (deadline) settings.deadline = new Date(deadline);
  if (courseTitle) settings.courseTitle = courseTitle;
  if (regularPrice) settings.regularPrice = regularPrice;
  if (offerPrice) settings.offerPrice = offerPrice;
  if (description !== undefined) settings.description = description;
  
  await settings.save();
  
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Settings updated successfully',
    data: settings,
  });
});

export const exclusiveOfferSettingsController = {
  getSettings,
  updateSettings,
};