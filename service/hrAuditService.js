import db from '../models/index.js'

const { Audit } = db

export async function logHrAudit({ userId, action, tableName, oldData, newData }) {
  try {
    await Audit.create({
      userId,
      action,
      tableName,
      oldData: oldData || null,
      newData: newData || null,
    })
  } catch (err) {
    console.error('HR audit log failed:', err.message)
  }
}
