const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const templateController = require('../controllers/templateController');

// Get all templates
router.get('/', authMiddleware, templateController.getAllTemplates);

// Get template by id
router.get('/:id', authMiddleware, templateController.getTemplateById);

// Create template (admin only)
router.post('/', authMiddleware, adminMiddleware, templateController.createTemplate);

// Update template (admin only)
router.put('/:id', authMiddleware, adminMiddleware, templateController.updateTemplate);

// Delete template (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, templateController.deleteTemplate);

// Get groups for a template
router.get('/:id/groups', authMiddleware, templateController.getTemplateGroups);

// Add group to template (admin only)
router.post('/:id/groups/:groupId', authMiddleware, adminMiddleware, templateController.addGroupToTemplate);

// Remove group from template (admin only)
router.delete('/:id/groups/:groupId', authMiddleware, adminMiddleware, templateController.removeGroupFromTemplate);

module.exports = router; 