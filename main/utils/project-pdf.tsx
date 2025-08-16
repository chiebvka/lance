import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'

Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf',
})

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  title: { fontSize: 24, marginBottom: 6 },
  metaRow: { fontSize: 10, color: '#6b7280' },
  sectionTitle: { fontSize: 14, marginTop: 16, marginBottom: 8 },
  paragraph: { fontSize: 11, color: '#1f2937', lineHeight: 1.4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cell: { fontSize: 11, color: '#1f2937' },
  logo: { width: 60, height: 60, objectFit: 'contain', alignSelf: 'flex-end' },
  listItem: { fontSize: 11, marginBottom: 4 },
  separator: { borderBottom: 1, borderColor: '#e5e7eb', marginVertical: 12 },
  h1: { fontSize: 18, marginTop: 8, marginBottom: 6, color: '#111827' },
  h2: { fontSize: 16, marginTop: 8, marginBottom: 6, color: '#111827' },
  h3: { fontSize: 14, marginTop: 8, marginBottom: 6, color: '#111827' },
  h4: { fontSize: 13, marginTop: 8, marginBottom: 6, color: '#111827' },
  h5: { fontSize: 12, marginTop: 8, marginBottom: 6, color: '#111827' },
  h6: { fontSize: 11, marginTop: 8, marginBottom: 6, color: '#111827' },
  list: { marginTop: 4, marginBottom: 4 },
})

export interface ProjectPDFData {
  id: string
  name: string | null
  description: string | null
  type: 'personal' | 'customer' | string | null
  customerName?: string | null
  organizationName?: string | null
  organizationLogoUrl?: string | null
  budget?: number | null
  currency?: string | null
  startDate?: string | null
  endDate?: string | null
  serviceAgreement?: string | null
  deliverables?: Array<{ name?: string | null; description?: string | null; dueDate?: string | null }>
}

const fmtDate = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy') : 'N/A')
const fmtMoney = (v?: number | null, cur: string = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(v ?? 0)

// Minimal HTML-to-PDF conversion for common tags produced by TipTap
function renderAgreementContent(html: string) {
  const blocks: Array<{ type: 'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'p'|'ul'|'ol'|'li'; content: string } | { type: 'list'; ordered: boolean; items: string[] } > = []

  // Split by block tags while preserving them
  const normalized = html
    .replace(/\r\n|\r/g, '\n')
    .replace(/<\/(p|h1|h2|h3|h4|h5|h6)>/gi, '</$1>\n')
    .replace(/<li>/gi, '<li>')

  const lines = normalized.split(/\n+/)

  let listBuffer: { ordered: boolean; items: string[] } | null = null

  const flushList = () => {
    if (listBuffer && listBuffer.items.length > 0) {
      blocks.push({ type: 'list', ordered: listBuffer.ordered, items: listBuffer.items })
    }
    listBuffer = null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Detect headings
    const headingMatch = trimmed.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h\1>$/i)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1] as '1'|'2'|'3'|'4'|'5'|'6'
      const content = stripHtml(headingMatch[2])
      blocks.push({ type: ('h' + level) as any, content })
      continue
    }

    // Detect unordered list block
    const ulMatch = trimmed.match(/^<ul[^>]*>([\s\S]*?)<\/ul>$/i)
    if (ulMatch) {
      flushList()
      const items = Array.from(ulMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map(m => stripHtml(m[1]))
      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    // Detect ordered list block
    const olMatch = trimmed.match(/^<ol[^>]*>([\s\S]*?)<\/ol>$/i)
    if (olMatch) {
      flushList()
      const items = Array.from(olMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map(m => stripHtml(m[1]))
      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    // Detect list item (fallback if li appears outside ul/ol)
    const liMatch = trimmed.match(/^<li[^>]*>([\s\S]*?)<\/li>$/i)
    if (liMatch) {
      const content = stripHtml(liMatch[1])
      if (!listBuffer) listBuffer = { ordered: false, items: [] }
      listBuffer.items.push(content)
      continue
    }

    // Paragraph
    const pMatch = trimmed.match(/^<p[^>]*>([\s\S]*?)<\/p>$/i)
    if (pMatch) {
      flushList()
      const content = stripHtml(pMatch[1])
      blocks.push({ type: 'p', content })
      continue
    }

    // Fallback: treat as plain text paragraph (strip all tags)
    flushList()
    blocks.push({ type: 'p', content: stripHtml(trimmed) })
  }

  flushList()

  return (
    <View>
      {blocks.map((b, i) => {
        if ((b as any).type === 'list') {
          const list = b as { type: 'list'; ordered: boolean; items: string[] }
          return (
            <View key={i} style={styles.list}>
              {list.items.map((item, idx) => (
                <Text key={idx} style={styles.paragraph}>
                  {list.ordered ? `${idx + 1}. ` : '• '} {item}
                </Text>
              ))}
            </View>
          )
        }
        switch ((b as any).type) {
          case 'h1':
            return <Text key={i} style={styles.h1}>{(b as any).content}</Text>
          case 'h2':
            return <Text key={i} style={styles.h2}>{(b as any).content}</Text>
          case 'h3':
            return <Text key={i} style={styles.h3}>{(b as any).content}</Text>
          case 'h4':
            return <Text key={i} style={styles.h4}>{(b as any).content}</Text>
          case 'h5':
            return <Text key={i} style={styles.h5}>{(b as any).content}</Text>
          case 'h6':
            return <Text key={i} style={styles.h6}>{(b as any).content}</Text>
          default:
            return <Text key={i} style={styles.paragraph}>{(b as any).content}</Text>
        }
      })}
    </View>
  )
}

function stripHtml(input: string) {
  // Convert <br> and <br/> into newlines first
  const withLineBreaks = input.replace(/<br\s*\/?>(\s*)/gi, '\n')
  // Remove other tags
  const noTags = withLineBreaks.replace(/<[^>]+>/g, '')
  // Collapse whitespace
  return noTags.replace(/\s+/g, ' ').trim()
}

export function generateProjectPDF(project: ProjectPDFData) {
  const orgName = project.organizationName || 'Company'
  const customer = project.type === 'customer' ? (project.customerName || 'Client') : undefined
  const currency = project.currency || 'USD'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{project.name || 'Project'}</Text>
          <Text style={styles.metaRow}>Type: {project.type || 'N/A'}</Text>
          <Text style={styles.metaRow}>Organization: {orgName}</Text>
          {customer && <Text style={styles.metaRow}>Customer: {customer}</Text>}
        </View>

        {project.organizationLogoUrl && (
          <Image src={project.organizationLogoUrl} style={styles.logo} />
        )}

        {/* Overview */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.row}>
          <Text style={styles.cell}>Start: {fmtDate(project.startDate)}</Text>
          <Text style={styles.cell}>End: {fmtDate(project.endDate)}</Text>
          <Text style={styles.cell}>Budget: {fmtMoney(project.budget, currency)}</Text>
        </View>
        {project.description && (
          <Text style={[styles.paragraph, { marginTop: 8 }]}>{project.description}</Text>
        )}

        <View style={styles.separator} />

        {/* Deliverables */}
        {project.deliverables && project.deliverables.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            {project.deliverables.map((d, idx) => (
              <Text key={idx} style={styles.listItem}>
                • {d.name || 'Deliverable'} — {d.description || 'No description'}
                {d.dueDate ? ` (Due: ${fmtDate(d.dueDate)})` : ''}
              </Text>
            ))}
            <View style={styles.separator} />
          </>
        )}

        {/* Service Agreement */}
        {project.serviceAgreement && (
          <>
            <Text style={styles.sectionTitle}>Service Agreement</Text>
            {renderAgreementContent(project.serviceAgreement)}
          </>
        )}
      </Page>
    </Document>
  )
}

export async function downloadProjectAsPDF(project: ProjectPDFData, filename?: string) {
  const { pdf } = await import('@react-pdf/renderer')
  const blob = await pdf(generateProjectPDF(project)).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${project.name || 'project'}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


export async function generateProjectPDFBlob(project: ProjectPDFData): Promise<Blob> {
  try {
    const { pdf } = await import('@react-pdf/renderer')
    return await pdf(generateProjectPDF(project)).toBlob()
  } catch (error) {
    console.error('Error generating Project PDF blob:', error)
    throw error
  }
}


