"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Code from "@tiptap/extension-code";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Blockquote from "@tiptap/extension-blockquote";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Quote,
  TableIcon,
} from "lucide-react";
import { Input } from "../ui/input";
import { Tooltip } from "../ui/tooltip";

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  placeholder?: string;
}

// Define extensions outside the component to avoid multiple instances
const extensions = [
  StarterKit,
  Code,
  Link.configure({
    openOnClick: true,
    autolink: true,
    defaultProtocol: "https",
    protocols: ["http", "https"],
    isAllowedUri: (url, ctx) => {
      try {
        const parsedUrl = url.includes(":") ? new URL(url) : new URL(`https://${url}`);
        const disallowedProtocols = ["ftp", "file", "mailto"];
        const protocol = parsedUrl.protocol.replace(":", "");
        if (disallowedProtocols.includes(protocol)) return false;
        const allowedProtocols = ctx.protocols.map((p) =>
          typeof p === "string" ? p : p.scheme
        );
        if (!allowedProtocols.includes(protocol)) return false;
        const disallowedDomains = ["example-phishing.com", "malicious-site.net"];
        const domain = parsedUrl.hostname;
        if (disallowedDomains.includes(domain)) return false;
        return true;
      } catch {
        return /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(url);
      }
    },
    shouldAutoLink: (url) => {
      console.log("Checking autolink for:", url);
      try {
        const parsedUrl = url.includes(":") ? new URL(url) : new URL(`https://${url}`);
        const disallowedDomains = ["example-no-autolink.com", "another-no-autolink.com"];
        const domain = parsedUrl.hostname;
        return !disallowedDomains.includes(domain);
      } catch (e) {
        console.error("Autolink error:", e);
        return /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(url);
      }
    },
    HTMLAttributes: {
      target: "_blank", // Open links in a new tab
      rel: "noopener noreferrer nofollow", // Add security and SEO attributes
    },
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Table.configure(),
  TableRow,
  TableCell,
  TableHeader,
  Blockquote,
  Underline,
];

export function TipTapEditor({
  content,
  onChange,
  className,
  placeholder = "Start writing your content here...",
}: TipTapEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    editable: true,
    extensions,
    content: content || `
      <p>This is a sample paragraph for previewing the editor. It demonstrates basic text formatting and can be enhanced with tables, blockquotes, and links as needed.</p>
    `,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setIsLinkModalOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(() => {
    if (linkUrl === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      let url = linkUrl;
      if (!url.includes("://") && !url.includes("mailto:")) {
        url = `https://${url}`;
      }
      try {
        editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      } catch (e) {
        if (e instanceof Error) {
          alert(e.message);
        } else {
          alert("An error occurred while setting the link");
        }
      }
    }
    setIsLinkModalOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleLinkCancel = useCallback(() => {
    setIsLinkModalOpen(false);
    setLinkUrl("");
  }, []);

  if (!editor) {
    return <div className={`border rounded-md ${className}`}>Loading editor...</div>;
  }

  return (
    <div className={`border  ${className}`}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-purple-100 dark:bg-purple-900/30">
      <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          type="button"
        >
          <Undo className="h-4 w-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          type="button"
        >
          <Redo className="h-4 w-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-purple-100  text-purple-700" : "text-primary"}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <Quote className="h-4 w-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          type="button"
        >
          <TableIcon className="h-4 w-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={editor.isActive("link") ? "bg-purple-100 text-purple-700" : "text-primary"}
          style={{ cursor: "pointer" }} 
          type="button"
          title="Add or edit a link" 
        >
          <LinkIcon className="h-4 w-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <AlignLeft className="h-4 w-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={editor.isActive({ textAlign: "center" }) ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <AlignCenter className="h-4 w-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={editor.isActive({ textAlign: "right" }) ? "bg-purple-100 text-purple-700" : "text-primary"}
          type="button"
        >
          <AlignRight className="h-4 w-4 text-primary" />
        </Button>
    
      </div>
      <EditorContent editor={editor} className="p-1 min-h-[200px] prose prose-sm max-w-none cursor-text" />
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6  shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4 text-purple-700">Add Your Custom Link</h2>
            <Input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Type your URL here (e.g., example.com)"
              className="w-full p-2 border border-purple-300  mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleLinkCancel}
                className="px-4 py-2 hover:bg-gray-300 "
              >
                Cancel
              </button>
              <Button
                onClick={handleLinkSubmit}
                // className="px-4 py-2 bg-purple-500 text-white  hover:bg-purple-600"
              >
                Add Link
              </Button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          min-height: 200px;
          outline: none;
          background-color: #f9f5ff; /* Light mode background */
          color: hsl(var(--foreground));
        }
        /* Dark mode editor surface + typography */
        .dark .ProseMirror {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .dark .ProseMirror p,
        .dark .ProseMirror li,
        .dark .ProseMirror h1,
        .dark .ProseMirror h2,
        .dark .ProseMirror h3,
        .dark .ProseMirror h4,
        .dark .ProseMirror h5,
        .dark .ProseMirror h6 {
          color: hsl(var(--foreground));
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .dark .ProseMirror p.is-editor-empty:first-child::before,
        .dark .is-editor-empty:first-child::before {
          color: #9ca3af; /* muted placeholder in dark */
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.25rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror ::selection {
          background: #e9d5ff; /* Light purple selection */
        }
        .dark .ProseMirror ::selection {
          background: rgba(168, 85, 247, 0.35); /* primary/35 */
        }
        .ProseMirror a {
          color: #6b21a8; /* Purple for links */
          text-decoration: underline;
          cursor: pointer;
        }
        .dark .ProseMirror a {
          color: hsl(var(--primary));
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.5rem 0;
        }
        .ProseMirror td,
        .ProseMirror th {
          border: 1px solid #e9d5ff;
          padding: 0.5rem;
        }
        .dark .ProseMirror td,
        .dark .ProseMirror th {
          border-color: rgba(168, 85, 247, 0.25);
        }
        .ProseMirror th {
          background-color: #e9d5ff;
          font-weight: bold;
        }
        .dark .ProseMirror th {
          background-color: rgba(168, 85, 247, 0.2);
        }
        .ProseMirror blockquote {
          border-left: 4px solid #6b21a8;
          padding-left: 1rem;
          color: #4c1d95;
          margin: 0.5rem 0;
        }
        .dark .ProseMirror blockquote {
          border-left-color: rgba(168, 85, 247, 0.7);
          color: rgba(229, 231, 235, 0.9);
        }
      `}</style>
    </div>
  );
}