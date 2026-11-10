import prisma from '../config/db.js';

// 1. Get All Settings Key-Values
export const getSettings = async (req, res, next) => {
  try {
    const list = await prisma.setting.findMany();
    // Transform list array to easy key-value object { key: value }
    const settingsObject = {};
    list.forEach(item => {
      settingsObject[item.key] = item.value;
    });

    res.status(200).json({ success: true, settings: settingsObject });
  } catch (error) {
    next(error);
  }
};

// 2. Bulk Update Settings (Admin Only)
export const updateSettings = async (req, res, next) => {
  const settingsData = req.body; // Expects object { key: value, ... }

  try {
    const updates = [];
    for (const key in settingsData) {
      if (Object.prototype.hasOwnProperty.call(settingsData, key)) {
        updates.push(
          prisma.setting.upsert({
            where: { key },
            update: { value: String(settingsData[key]) },
            create: { key, value: String(settingsData[key]) }
          })
        );
      }
    }

    await prisma.$transaction(updates);

    // Logging action
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_SETTINGS',
        details: `Updated bulk configuration settings: ${Object.keys(settingsData).join(', ')}`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({ success: true, message: 'Configuration settings updated.' });
  } catch (error) {
    next(error);
  }
};
