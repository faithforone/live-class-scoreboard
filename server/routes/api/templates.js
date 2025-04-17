const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const templateController = require('../../controllers/templateController');

// @route   GET api/templates
// @desc    Get all templates
// @access  Public
router.get('/', templateController.getAllTemplates);

// @route   GET api/templates/:id
// @desc    Get template by ID
// @access  Public
router.get('/:id', templateController.getTemplateById);

// @route   POST api/templates
// @desc    Create a template
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('metrics', 'Metrics must be an array').isArray()
    ]
  ],
  templateController.createTemplate
);

// @route   PUT api/templates/:id
// @desc    Update a template
// @access  Private
router.put('/:id', auth, templateController.updateTemplate);

// @route   DELETE api/templates/:id
// @desc    Delete a template
// @access  Private
router.delete('/:id', auth, templateController.deleteTemplate);

// @route   GET api/templates/:id/groups
// @desc    Get all groups for a template
// @access  Public
router.get('/:id/groups', templateController.getTemplateGroups);

// @route   POST api/templates/:id/groups/:groupId
// @desc    Add a group to a template
// @access  Private
router.post('/:id/groups/:groupId', auth, templateController.addGroupToTemplate);

// @route   DELETE api/templates/:id/groups/:groupId
// @desc    Remove a group from a template
// @access  Private
router.delete('/:id/groups/:groupId', auth, templateController.removeGroupFromTemplate);

module.exports = router; 