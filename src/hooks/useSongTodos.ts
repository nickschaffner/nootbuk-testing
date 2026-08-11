import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { SongTodo } from '@/types/song'

export function useTodosForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getTodosForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export async function getTodosForSong(songId: string): Promise<SongTodo[]> {
  try {
    return await db.songTodos.where('songId').equals(songId).sortBy('sortOrder')
  } catch (error) {
    console.warn('getTodosForSong failed:', error)
    throw error
  }
}

export async function createTodo(
  songId: string,
  text: string,
  timestamp: number | null = null,
): Promise<SongTodo> {
  try {
    const existing = await db.songTodos.where('songId').equals(songId).toArray()
    const sortOrder =
      existing.length === 0
        ? 0
        : Math.max(...existing.map((t) => t.sortOrder)) + 1

    const todo: SongTodo = {
      id: crypto.randomUUID(),
      songId,
      text,
      timestamp,
      completed: false,
      sortOrder,
      createdAt: new Date().toISOString(),
    }

    await db.songTodos.add(todo)
    return todo
  } catch (error) {
    console.warn('createTodo failed:', error)
    throw error
  }
}

export async function updateTodo(
  input: Partial<Omit<SongTodo, 'id' | 'songId' | 'createdAt'>> & { id: string },
): Promise<SongTodo> {
  try {
    const existing = await db.songTodos.get(input.id)
    if (!existing) {
      throw new Error(`Todo not found: ${input.id}`)
    }

    const updated: SongTodo = { ...existing, ...input }
    await db.songTodos.put(updated)
    return updated
  } catch (error) {
    console.warn('updateTodo failed:', error)
    throw error
  }
}

export async function toggleComplete(id: string): Promise<SongTodo> {
  try {
    const existing = await db.songTodos.get(id)
    if (!existing) {
      throw new Error(`Todo not found: ${id}`)
    }

    const updated: SongTodo = { ...existing, completed: !existing.completed }
    await db.songTodos.put(updated)
    return updated
  } catch (error) {
    console.warn('toggleComplete failed:', error)
    throw error
  }
}

export async function deleteTodo(id: string): Promise<void> {
  try {
    await db.songTodos.delete(id)
  } catch (error) {
    console.warn('deleteTodo failed:', error)
    throw error
  }
}

export async function reorderTodos(orderedIds: string[]): Promise<void> {
  try {
    await db.transaction('rw', db.songTodos, async () => {
      await Promise.all(
        orderedIds.map((id, index) =>
          db.songTodos.update(id, { sortOrder: index }),
        ),
      )
    })
  } catch (error) {
    console.warn('reorderTodos failed:', error)
    throw error
  }
}
