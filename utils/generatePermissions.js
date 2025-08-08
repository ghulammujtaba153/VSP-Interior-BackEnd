import fs from 'fs';
import path from 'path';
import db from '../models/index.js'; // Sequelize models entry
const Permission = db.Permission;

// Recursively get all files ending with `.controller.js`
const getAllControllerFiles = (dirPath, files = []) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      getAllControllerFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.controller.js')) {
      files.push(fullPath);
    }
  }

  return files;
};

export const generatePermissionsFromControllers = async () => {
  try {
    // First, let's see what permissions already exist
    const existingPermissions = await Permission.findAll();
    console.log(`📋 Found ${existingPermissions.length} existing permissions:`);
    existingPermissions.forEach(p => console.log(`  - ${p.resource} (ID: ${p.id})`));
    
    const controllersPath = path.join(process.cwd(), 'controller');
    
    if (!fs.existsSync(controllersPath)) {
      console.log(`❌ Controller directory does not exist: ${controllersPath}`);
      return;
    }

    const controllerFiles = getAllControllerFiles(controllersPath);
    console.log(`🔍 Found ${controllerFiles.length} controller files`);

    for (const fullPath of controllerFiles) {
      const fileName = path.basename(fullPath); // e.g., user.controller.js
      const resourceName = fileName.replace('.controller.js', ''); // "user"

      console.log(`🔍 Processing resource: ${resourceName}`);

      // Check if permission for this resource already exists
      const existing = await Permission.findOne({
        where: { resource: resourceName }
      });

      if (!existing) {
        try {
          await Permission.create({
            resource: resourceName,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true
          });
          console.log(`✅ Created permission for resource: ${resourceName}`);
        } catch (createError) {
          console.log(`❌ Failed to create permission for ${resourceName}:`, createError.message);
        }
      } else {
        console.log(`ℹ️  Permission for resource '${resourceName}' already exists (ID: ${existing.id})`);
      }
    }

    console.log('🎉 Permission generation complete.');
  } catch (error) {
    console.error('❌ Error in generatePermissionsFromControllers:', error);
  }
};
