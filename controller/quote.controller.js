import db from "../models/index.js";

const { Quote } = db;

export const createQuote = async (req, res) => {
    try {
        const { quoteData, startDate, endDate, status } = req.body;
        const newQuote = await Quote.create({
            quoteData,
            startDate: startDate || new Date(),
            endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            status: status || 'Draft'
        });

        res.status(201).json({
            success: true,
            message: "Quote created successfully",
            data: newQuote
        });
    } catch (error) {
        console.error("Error creating quote:", error);
        res.status(500).json({
            success: false,
            message: "Error creating quote",
            error: error.message
        });
    }
};

export const getQuotes = async (req, res) => {
    try {
        const quotes = await Quote.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            success: true,
            data: quotes
        });
    } catch (error) {
        console.error("Error fetching quotes:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching quotes",
            error: error.message
        });
    }
};

export const getQuoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const quote = await Quote.findByPk(id);
        
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found"
            });
        }

        res.status(200).json({
            success: true,
            data: quote
        });
    } catch (error) {
        console.error("Error fetching quote:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching quote",
            error: error.message
        });
    }
};

export const updateQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const { quoteData, startDate, endDate, status } = req.body;

        const quote = await Quote.findByPk(id);
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found"
            });
        }

        await quote.update({
            quoteData: quoteData !== undefined ? quoteData : quote.quoteData,
            startDate: startDate !== undefined ? startDate : quote.startDate,
            endDate: endDate !== undefined ? endDate : quote.endDate,
            status: status !== undefined ? status : quote.status
        });

        res.status(200).json({
            success: true,
            message: "Quote updated successfully",
            data: quote
        });
    } catch (error) {
        console.error("Error updating quote:", error);
        res.status(500).json({
            success: false,
            message: "Error updating quote",
            error: error.message
        });
    }
};

export const deleteQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const quote = await Quote.findByPk(id);
        
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found"
            });
        }

        await quote.destroy();
        res.status(200).json({
            success: true,
            message: "Quote deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting quote:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting quote",
            error: error.message
        });
    }
};
