import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createTodo,
  deleteTodo,
  reorderTodos,
  toggleComplete,
  useTodosForSong,
} from '@/hooks/useSongTodos'
import { formatAudioTime } from '@/lib/audio'
import { songTodoSortableId } from '@/lib/dnd-ids'
import { parseMmSs } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SongTodo } from '@/types/song'

interface SongTodosTabProps {
  songId: string
}

export function SongTodosTab({ songId }: SongTodosTabProps) {
  const todos = useTodosForSong(songId)
  const [text, setText] = useState('')
  const [timestampInput, setTimestampInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const sortableIds = useMemo(
    () => (todos ?? []).map((todo) => songTodoSortableId(todo.id)),
    [todos],
  )

  async function handleAdd() {
    const trimmedText = text.trim()
    if (!trimmedText) {
      return
    }

    const timestamp = timestampInput.trim() ? parseMmSs(timestampInput) : null

    setIsAdding(true)
    try {
      await createTodo(songId, trimmedText, timestamp)
      setText('')
      setTimestampInput('')
    } catch {
      // createTodo already logs the error
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !todos) {
      return
    }

    const oldIndex = sortableIds.indexOf(String(active.id))
    const newIndex = sortableIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const orderedIds = arrayMove(
      todos.map((todo) => todo.id),
      oldIndex,
      newIndex,
    )

    try {
      await reorderTodos(orderedIds)
    } catch {
      // reorderTodos already logs the error
    }
  }

  if (todos === undefined) {
    return <p className="text-sm text-muted-foreground">Loading todos...</p>
  }

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          void handleAdd()
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="todo-text">New todo</Label>
          <Input
            id="todo-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What needs doing?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="todo-timestamp">Timestamp (optional)</Label>
          <Input
            id="todo-timestamp"
            value={timestampInput}
            onChange={(event) => setTimestampInput(event.target.value)}
            placeholder="mm:ss"
            className="w-28"
          />
        </div>

        <Button
          type="button"
          size="sm"
          disabled={isAdding || !text.trim()}
          onClick={() => void handleAdd()}
        >
          {isAdding ? 'Adding...' : 'Add Todo'}
        </Button>
      </form>

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No todos yet. Add one above.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {todos.map((todo) => (
                <SortableTodoItem key={todo.id} todo={todo} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

function SortableTodoItem({ todo }: { todo: SongTodo }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: songTodoSortableId(todo.id),
    data: { type: 'song-todo', todoId: todo.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function handleToggle() {
    try {
      await toggleComplete(todo.id)
    } catch {
      // toggleComplete already logs the error
    }
  }

  async function handleDelete() {
    try {
      await deleteTodo(todo.id)
    } catch {
      // deleteTodo already logs the error
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-card px-2 py-2',
        isDragging && 'z-10 opacity-60',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => void handleToggle()}
        className="size-4 shrink-0 accent-primary"
        aria-label={`Mark "${todo.text}" complete`}
      />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={cn(
            'min-w-0 flex-1 text-sm',
            todo.completed && 'text-muted-foreground line-through',
          )}
        >
          {todo.text}
        </span>
        {todo.timestamp !== null ? (
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {formatAudioTime(todo.timestamp)}
          </Badge>
        ) : null}
      </div>

      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => void handleDelete()}
        aria-label={`Delete "${todo.text}"`}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  )
}
