import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Email from '../models/Email.js';
import logger from '../utils/logger.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).populate('teamId').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    logger.error(`getUsers admin error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUserCredits = async (req, res) => {
  try {
    const { credits } = req.body;
    if (credits === undefined || credits < 0) {
      return res.status(400).json({ success: false, message: 'Valid credit count required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { aiCredits: Number(credits) },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`Admin manual override of credits for ${user.email} to: ${credits}`);

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    logger.error(`updateUserCredits error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLeads = await Lead.countDocuments();
    const totalEmails = await Email.countDocuments();

    // Grouping by plans
    const planGroups = await User.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);

    const leadStatusGroups = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalLeads,
        totalEmails,
        plans: planGroups.reduce((acc, curr) => ({ ...acc, [curr._id || 'free']: curr.count }), {}),
        leadsByStatus: leadStatusGroups.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
      }
    });
  } catch (error) {
    logger.error(`getSystemStats error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
