import express from 'express';
import { createPriceBookCategory, deletePriceBookCategory, getPriceBookCategories, updatePriceBookCategory } from '../../controller/suppliers.module/priceBookCategories.controller.js';

const priceBookCategoryRouter = express.Router();

priceBookCategoryRouter.post('/create', createPriceBookCategory);
priceBookCategoryRouter.get('/get/:id', getPriceBookCategories);
priceBookCategoryRouter.put('/update/:id', updatePriceBookCategory);
priceBookCategoryRouter.delete('/delete/:id', deletePriceBookCategory);

export default priceBookCategoryRouter;