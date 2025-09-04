import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /api/leads - Create a new lead (existing code)
router.post('/', async (req, res) => {
    const { title, expectedRevenue, probability } = req.body;
    const userId = req.user.id; 

    if (!title) {
        return res.status(400).json({ error: "Title is required." });
    }

    try {
        const firstStage = await prisma.pipelineStage.findFirst({ orderBy: { order: 'asc' } });
        const firstCustomer = await prisma.customer.findFirst();

        if (!firstStage || !firstCustomer) {
            return res.status(404).json({ error: "Default stage or customer not found." });
        }

        const newLead = await prisma.lead.create({
            data: {
                title,
                expectedRevenue: parseFloat(expectedRevenue),
                probability: parseFloat(probability),
                stageId: firstStage.id,
                customerId: firstCustomer.id,
                createdById: userId,
                assignedToId: userId,
            }
        });

        res.status(201).json(newLead);
    } catch (error) {
        console.error("Error creating lead:", error);
        res.status(500).json({ error: "Something went wrong." });
    }
});

// PATCH /api/leads/:leadId/move - Move a lead to a new stage (existing code)
router.patch('/:leadId/move', async (req, res) => {
    const { leadId } = req.params;
    const { newStageId } = req.body;

    if (!newStageId) {
        return res.status(400).json({ error: 'newStageId is required.' });
    }

    try {
        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: { stageId: newStageId },
        });
        res.json(updatedLead);
    } catch (error) {
        console.error('Error updating lead stage:', error);
        res.status(500).json({ error: "Something went wrong." });
    }
});


// --- NEW ROUTES FOR EDITING AND DELETING ---

/**
 * @route   PUT /api/leads/:id
 * @desc    Update a lead's details
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, expectedRevenue, probability } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        // Ensure the lead exists and belongs to the user before updating
        const lead = await prisma.lead.findFirst({
            where: { id: id, assignedToId: req.user.id }
        });

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found or you do not have permission to edit it.' });
        }

        const updatedLead = await prisma.lead.update({
            where: { id: id },
            data: {
                title,
                expectedRevenue: parseFloat(expectedRevenue),
                probability: parseFloat(probability),
            },
        });
        res.json(updatedLead);
    } catch (error) {
        console.error("Error updating lead:", error);
        res.status(500).json({ error: 'Server error while updating lead.' });
    }
});


/**
 * @route   DELETE /api/leads/:id
 * @desc    Delete a lead
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Ensure the lead exists and belongs to the user before deleting
        const lead = await prisma.lead.findFirst({
            where: { id: id, assignedToId: req.user.id }
        });

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found or you do not have permission to delete it.' });
        }

        await prisma.lead.delete({
            where: { id: id },
        });

        res.json({ msg: 'Lead successfully deleted' });
    } catch (error) {
        console.error("Error deleting lead:", error);
        res.status(500).json({ error: 'Server error while deleting lead.' });
    }
});


export default router;