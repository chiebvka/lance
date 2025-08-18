import { z } from "zod";


// ---- content blocks ----
const BlockBase = z.object({
  id: z.string().uuid(),
  position: z.number().int().nonnegative(), // 0,10,20…
  visible: z.boolean().optional(),
})

const HeadingBlock = BlockBase.extend({
  type: z.literal('heading'),
  props: z.object({ text: z.string().min(1), level: z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4),z.literal(5),z.literal(6)]).optional() }),
})

const TextBlock = BlockBase.extend({
  type: z.literal('text'),
  props: z.object({ markdown: z.string().min(1) }).strict(), // keep it simple for now
})

const LinkBlock = BlockBase.extend({
  type: z.literal('link'),
  props: z.object({
    title: z.string().min(1),
    url: z.string().url(),
    description: z.string().optional(),
    target: z.enum(['_self','_blank']).optional(),
    rel: z.string().optional(),
    icon: z.string().optional(),
  }),
})

const ImageBlock = BlockBase.extend({
  type: z.literal('image'),
  props: z.object({ fileId: z.string().min(1), alt: z.string().optional(), caption: z.string().optional(), width: z.number().int().positive().optional(), height: z.number().int().positive().optional() }),
})

const VideoBlock = BlockBase.extend({
  type: z.literal('video'),
  props: z.object({
    provider: z.enum(['youtube','vimeo','file','url']),
    url: z.string().url().optional(),
    fileId: z.string().optional(),
    title: z.string().optional(),
    autoplay: z.boolean().optional(),
    controls: z.boolean().optional(),
    loop: z.boolean().optional(),
  }).refine(p => (p.provider === 'file' ? !!p.fileId : !!p.url), { message: 'use fileId for provider=file, url otherwise' }),
})

const FileBlock = BlockBase.extend({
  type: z.literal('file'),
  props: z.object({ fileId: z.string().min(1), label: z.string().optional(), size: z.number().int().optional(), mime: z.string().optional() }),
})

export const BlockSchema = z.discriminatedUnion('type', [
  HeadingBlock, TextBlock, LinkBlock, ImageBlock, VideoBlock, FileBlock
])

export const WallContentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(BlockSchema).max(200),
}).superRefine((v, ctx) => {
  // no duplicate ids
  const seen = new Set<string>()
  v.blocks.forEach(b => {
    if (seen.has(b.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate block id ${b.id}` })
    seen.add(b.id)
  })
})
export type WallContent = z.infer<typeof WallContentSchema>
export type Block = z.infer<typeof BlockSchema>

// ---- wall payloads (forms + api) ----
export const createWallSchema = z.object({
  action: z.enum(["save_draft", "publish", "send_wall", "unpublish"]),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  content: WallContentSchema.optional().nullable(),
  type: z.enum(["private", "public", ""]).optional(),
  customerId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  protect: z.boolean().optional().default(false),
  recipientEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  recepientName: z.string().optional().nullable(),
})
  
  export type CreateWallDTO = z.infer<typeof createWallSchema>