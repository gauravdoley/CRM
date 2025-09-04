import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/authMiddleware.js'; // Import the middleware

const router = express.Router();
const prisma = new PrismaClient();

// Apply the auth middleware to all pipeline routes.
router.use(authMiddleware);

/**
 * @route   GET /api/pipelines/stages
 * @desc    Get all pipeline stages with leads for the logged-in user
 * @access  Private
 */
router.get('/stages', async (req, res) => {
    try {
        const stages = await prisma.pipelineStage.findMany({
            orderBy: { order: 'asc' },
            include: {
                // IMPORTANT: Only include leads that are assigned to the logged-in user.
                leads: {
                    where: {
                        assignedToId: req.user.id
                    }
                }
            }
        });
        res.json(stages);
    } catch (error) {
        console.error("Error fetching pipeline stages:", error);
        res.status(500).json({ error: "Something went wrong fetching pipeline stages." });
    }
});

// We don't need a POST route here anymore as stages are created via seed.

export default router;