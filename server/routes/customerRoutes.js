import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Protect all customer routes
router.use(authMiddleware);

/**
 * @route   GET /api/customers
 * @desc    Get all customers for the logged-in user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // In a real multi-tenant app, you'd link customers to users.
        // For simplicity here, we'll let users see all customers.
        const customers = await prisma.customer.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Private
 */
router.post('/', async (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
    }

    try {
        const newCustomer = await prisma.customer.create({
            data: { name, email, phone, address }
        });
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error("Error creating customer:", error);
        res.status(500).json({ error: 'Failed to create customer.' });
    }
});

export default router;