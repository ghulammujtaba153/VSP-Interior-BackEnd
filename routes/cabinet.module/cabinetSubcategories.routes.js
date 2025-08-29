import express from 'express';
import { createCabinetSubCategory, deleteCabinetSubCategory, getCabinetSubCategories, updateCabinetSubCategory } from '../../controller/cabinet/cabinetSubcategories.controller.js';

const cabinetSubcategoriesRouter = express.Router();


cabinetSubcategoriesRouter.post('/create', createCabinetSubCategory);
cabinetSubcategoriesRouter.get('/get/:id', getCabinetSubCategories);
cabinetSubcategoriesRouter.put('/update/:id', updateCabinetSubCategory);
cabinetSubcategoriesRouter.delete('/delete/:id', deleteCabinetSubCategory);

export default cabinetSubcategoriesRouter;