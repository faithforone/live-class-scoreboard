const { validationResult } = require('express-validator');
const { Template, Group } = require('../models');

/**
 * @route   GET api/templates
 * @desc    Get all templates
 * @access  Public
 */
const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll({
      attributes: ['id', 'name', 'description', 'metrics', 'isActive', 'createdAt', 'updatedAt'],
      include: [{ 
        model: Group, 
        as: 'groups', 
        attributes: ['id', 'name'] 
      }]
    });
    
    return res.json(templates);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET api/templates/:id
 * @desc    Get template by ID
 * @access  Public
 */
const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id, {
      attributes: ['id', 'name', 'description', 'metrics', 'isActive', 'createdAt', 'updatedAt'],
      include: [{ 
        model: Group, 
        as: 'groups', 
        attributes: ['id', 'name'] 
      }]
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    return res.json(template);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST api/templates
 * @desc    Create a new template
 * @access  Private
 */
const createTemplate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, description, metrics, isActive } = req.body;
  
  try {
    const template = await Template.create({
      name,
      description,
      metrics,
      isActive
    });
    
    return res.status(201).json(template);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT api/templates/:id
 * @desc    Update a template
 * @access  Private
 */
const updateTemplate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, description, metrics, isActive } = req.body;
  
  try {
    const template = await Template.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Update template fields
    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (metrics) template.metrics = metrics;
    if (isActive !== undefined) template.isActive = isActive;
    
    await template.save();
    
    return res.json(template);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   DELETE api/templates/:id
 * @desc    Delete a template
 * @access  Private
 */
const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    await template.destroy();
    
    return res.json({ message: 'Template removed' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET api/templates/:id/groups
 * @desc    Get all groups for a template
 * @access  Public
 */
const getTemplateGroups = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id, {
      attributes: ['id', 'name', 'description', 'metrics', 'isActive', 'createdAt', 'updatedAt'],
      include: [{ 
        model: Group, 
        as: 'groups', 
        attributes: ['id', 'name'] 
      }]
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    return res.json(template.groups);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST api/templates/:id/groups/:groupId
 * @desc    Add a group to a template
 * @access  Private
 */
const addGroupToTemplate = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    const group = await Group.findByPk(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if the association already exists
    const groups = await template.getGroups({ where: { id: req.params.groupId } });
    if (groups.length > 0) {
      return res.status(400).json({ message: 'Group already added to this template' });
    }
    
    await template.addGroup(group);
    
    // Get the updated template with all groups
    const updatedTemplate = await Template.findByPk(req.params.id, {
      attributes: ['id', 'name', 'description', 'metrics', 'isActive', 'createdAt', 'updatedAt'],
      include: [{ 
        model: Group, 
        as: 'groups', 
        attributes: ['id', 'name'] 
      }]
    });
    
    return res.json(updatedTemplate);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   DELETE api/templates/:id/groups/:groupId
 * @desc    Remove a group from a template
 * @access  Private
 */
const removeGroupFromTemplate = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    const group = await Group.findByPk(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if the association exists
    const groups = await template.getGroups({ where: { id: req.params.groupId } });
    if (groups.length === 0) {
      return res.status(400).json({ message: 'Group is not associated with this template' });
    }
    
    await template.removeGroup(group);
    
    return res.json({ message: 'Group removed from template' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateGroups,
  addGroupToTemplate,
  removeGroupFromTemplate
}; 