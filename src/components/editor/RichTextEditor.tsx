import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
} from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write something...',
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-32 px-3 py-2 focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  function handleInsertImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const src = reader.result
        if (typeof src === 'string') {
          editor.chain().focus().setImage({ src }).run()
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function handleInsertLink() {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', previousUrl ?? 'https://')

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className={cn('rounded-md border bg-background', className)}>
      <div className="flex flex-wrap gap-1 border-b p-1">
        <Button
          type="button"
          size="icon"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          className="size-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
          <span className="sr-only">Bold</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          className="size-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
          <span className="sr-only">Italic</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          className="size-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
          <span className="sr-only">Heading 2</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          className="size-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
          <span className="sr-only">Heading 3</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={handleInsertImage}
        >
          <ImageIcon className="size-4" />
          <span className="sr-only">Insert image</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
          className="size-8"
          onClick={handleInsertLink}
        >
          <Link2 className="size-4" />
          <span className="sr-only">Insert link</span>
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
