import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';
import logger from '../utils/logger.js';

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ lead: req.params.leadId })
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    logger.error(`getTasks error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, assignedTo } = req.body;
    const { leadId } = req.params;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const task = await Task.create({
      title,
      description,
      lead: leadId,
      dueDate,
      priority: priority || 'medium',
      assignedTo: assignedTo || req.user._id
    });

    // Log CRM Activity
    await Activity.create({
      lead: leadId,
      user: req.user._id,
      type: 'task_added',
      description: `Created task: "${title}"`,
    });

    res.status(201).json({
      success: true,
      data: { task }
    });
  } catch (error) {
    logger.error(`createTask error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('lead');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }



    task.status = task.status === 'completed' ? 'pending' : 'completed';
    await task.save();

    // Log Activity
    await Activity.create({
      lead: task.lead._id,
      user: req.user._id,
      type: 'task_completed',
      description: `Marked task "${task.title}" as ${task.status}`,
    });

    res.status(200).json({
      success: true,
      data: { task }
    });
  } catch (error) {
    logger.error(`completeTask error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ lead: req.params.leadId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    logger.error(`getActivities error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
