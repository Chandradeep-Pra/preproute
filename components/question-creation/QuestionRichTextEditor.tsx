"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  Trash2,
  Underline,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

type QuestionRichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

export default function QuestionRichTextEditor({
  value = "",
  onChange,
  placeholder = "Type here",
}: QuestionRichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      UnderlineExtension,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      TextAlign.configure({
        types: ["paragraph"],
      }),
      Image.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[190px] rounded-b-[18px] border border-slate-200 bg-white p-4 text-sm text-slate-700 outline-none focus:ring-0",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange?.(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[190px] rounded-[18px] border border-slate-200 p-4 text-sm text-slate-400">
        {placeholder}
      </div>
    );
  }

  const setLink = () => {
    const url = window.prompt("Enter the URL");
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (src) {
        editor.chain().focus().setImage({ src }).run();
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-3 py-2 text-slate-500">
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className="toolbar-btn">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className="toolbar-btn">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className="toolbar-btn">
          <Underline className="h-4 w-4" />
        </button>
        <button type="button" onClick={setLink} className="toolbar-btn">
          <Link2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="toolbar-btn">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className="toolbar-btn">
          <AlignLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className="toolbar-btn">
          <AlignCenter className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className="toolbar-btn">
          <AlignRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className="toolbar-btn">
          <AlignJustify className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" onClick={insertImage} className="toolbar-btn">
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => {
            // Reserved for math/formula insertion UI.
            editor.chain().focus().insertContent(" ").run();
          }}
        >
          <span className="text-sm italic">fx</span>
        </button>
      </div>

      <div className="relative">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        <EditorContent editor={editor} />
        <button
          type="button"
          onClick={() => editor.commands.clearContent()}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
          aria-label="Clear editor"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <style jsx global>{`
        .toolbar-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          padding: 0.35rem;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .toolbar-btn:hover {
          background: rgb(248 250 252);
          color: rgb(15 23 42);
        }
        .ProseMirror {
          min-height: 190px;
          outline: none;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 0.75rem 0;
          border-radius: 0.75rem;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: rgb(148 163 184);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
