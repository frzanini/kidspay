import { openDB } from 'idb'

const DB_NAME = 'kidspay'
const DB_VERSION = 1

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile')
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const tasks = db.createObjectStore('tasks', { keyPath: 'id' })
        tasks.createIndex('category', 'category')
        tasks.createIndex('active', 'active')
      }
      if (!db.objectStoreNames.contains('checklist')) {
        const checklist = db.createObjectStore('checklist', { keyPath: 'id' })
        checklist.createIndex('weekId', 'weekId')
        checklist.createIndex('taskId', 'taskId')
      }
      if (!db.objectStoreNames.contains('weeks')) {
        db.createObjectStore('weeks', { keyPath: 'id' })
      }
    },
  })
}
