import bcrypt from 'bcrypt'
import { Op } from 'sequelize'
import db from '../models/index.js'

const SUPER_ADMIN_EMAIL = 'vishal@vspinteriors.co.nz'
const SUPER_ADMIN_PASSWORD = 'admin123'
const SUPER_ADMIN_ROLE_NAMES = ['Super Admin', 'superadmin', 'SuperAdmin', 'super_admin']

const RESOURCE_NAMES = [
  'users',
  'roles',
  'permissions',
  'resources',
  'clients',
  'suppliers',
  'inventory',
  'cabinet',
  'human resource',
  'projects',
  'workers',
  'quotes',
  'purchasing',
  'accounts',
  'reports',
  'tracking board',
]

async function registerSuperAdmin() {
  await db.sequelize.authenticate()
  await db.sequelize.query(
    'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS salary INTEGER'
  )
  await db.sequelize.sync({
    alter: false,
  })

  const transaction = await db.sequelize.transaction()

  try {
    let role = await db.Role.findOne({
      where: { name: { [Op.in]: SUPER_ADMIN_ROLE_NAMES } },
      transaction,
    })

    if (!role) {
      role = await db.Role.create({ name: 'Super Admin' }, { transaction })
      console.log(`Created role: ${role.name}`)
    } else {
      console.log(`Using role: ${role.name}`)
    }

    const existingResources = await db.Resource.findAll({ transaction })
    const allResourceNames = new Map()

    for (const name of RESOURCE_NAMES) {
      allResourceNames.set(name.toLowerCase(), name)
    }

    for (const resource of existingResources) {
      allResourceNames.set(resource.name.toLowerCase(), resource.name)
    }

    for (const [, resourceName] of allResourceNames) {
      let resource = await db.Resource.findOne({
        where: { name: resourceName },
        transaction,
      })

      if (!resource) {
        resource = await db.Resource.create({ name: resourceName }, { transaction })
      }

      await db.Permission.findOrCreate({
        where: {
          roleId: role.id,
          resourceId: resource.id,
        },
        defaults: {
          roleId: role.id,
          resourceId: resource.id,
          canCreate: true,
          canView: true,
          canEdit: true,
          canDelete: true,
        },
        transaction,
      }).then(async ([permission]) => {
        await permission.update(
          {
            canCreate: true,
            canView: true,
            canEdit: true,
            canDelete: true,
          },
          { transaction }
        )
      })
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10)
    const [user, created] = await db.User.findOrCreate({
      where: { email: SUPER_ADMIN_EMAIL },
      defaults: {
        name: 'Vishal',
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        roleId: role.id,
        status: 'active',
      },
      transaction,
    })

    if (!created) {
      await user.update(
        {
          name: 'Vishal',
          password: hashedPassword,
          roleId: role.id,
          status: 'active',
        },
        { transaction }
      )
      console.log(`Updated superadmin user: ${SUPER_ADMIN_EMAIL}`)
    } else {
      console.log(`Created superadmin user: ${SUPER_ADMIN_EMAIL}`)
    }

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  } finally {
    await db.sequelize.close()
  }
}

registerSuperAdmin().catch((error) => {
  console.error('Superadmin registration failed:', error.message)
  process.exit(1)
})
