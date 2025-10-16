import express from 'express';
import { createPriceBookCategory, deletePriceBookCategory, getPriceBookCategories, updatePriceBookCategory, getAvailableVersions } from '../../controller/suppliers.module/priceBookCategories.controller.js';

const priceBookCategoryRouter = express.Router();

priceBookCategoryRouter.post('/create', createPriceBookCategory);
priceBookCategoryRouter.get('/get/:id', getPriceBookCategories);
priceBookCategoryRouter.put('/update/:id', updatePriceBookCategory);
priceBookCategoryRouter.delete('/delete/:id', deletePriceBookCategory);
priceBookCategoryRouter.get('/versions/:supplierId', getAvailableVersions);

export default priceBookCategoryRouter;