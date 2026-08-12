import { db } from '@/lib/db'

/** Clear every Dexie table — full clean slate. */
export async function wipeAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}
