import express from 'express';
import { createCabinetCategory, deleteCabinetCategory, getCabinetCategories, getCabinetCategory, updateCabinetCategory } from '../../controller/cabinet/cabinetCategories.controller.js';

const cabinetCategoriesRouter = express.Router();


cabinetCategoriesRouter.post('/create', createCabinetCategory);
cabinetCategoriesRouter.get('/get', getCabinetCategories);
cabinetCategoriesRouter.get('/get/:id', getCabinetCategory);
cabinetCategoriesRouter.put('/update/:id', updateCabinetCategory);
cabinetCategoriesRouter.delete('/delete/:id', deleteCabinetCategory);

export default cabinetCategoriesRouter;