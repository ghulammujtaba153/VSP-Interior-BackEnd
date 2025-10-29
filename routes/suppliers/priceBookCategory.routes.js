import express from 'express';
import { createPriceBookCategory, deletePriceBookCategory, getPriceBookCategories, updatePriceBookCategory, getAvailableVersions } from '../../controller/suppliers/priceBookCategories.controller.js';

const priceBookCategoryRouter = express.Router();

priceBookCategoryRouter.post('/create', createPriceBookCategory);
priceBookCategoryRouter.get('/get', getPriceBookCategories); // No :id needed - categories are independent
priceBookCategoryRouter.put('/update/:id', updatePriceBookCategory);
priceBookCategoryRouter.delete('/delete/:id', deletePriceBookCategory);
priceBookCategoryRouter.get('/versions/:categoryId', getAvailableVersions); // Changed to categoryId

export default priceBookCategoryRouter;