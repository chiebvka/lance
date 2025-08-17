"use client"

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, FileText, User, Calendar, Clock, Download, HardDriveDownload } from 'lucide-react'
import { SignaturePad } from '@/components/signature-pad'
import { TypedSignature } from '@/components/typed-signature'
import { TipTapEditor } from '@/components/tiptap/tip-tap-editor'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import SubscriptionNotice from '@/app/(previews)/_components/SubscriptionNotice'
import ConfirmModal from './confirm-modal'
import { downloadProjectAsPDF, ProjectPDFData } from '@/utils/project-pdf'

interface ProjectPreviewProps {
  projectId: string
  token: string
}

type ProjectData = {
  id: string
  name: string | null
  state: 'draft' | 'published'
  status: string | null
  type: 'personal' | 'customer' | string | null
  description?: string | null
  startDate: string | null
  endDate: string | null
  created_at: string | null
  budget: number | null
  currency: string | null
  organizationId?: { name: string | null; logoUrl: string | null; email: string | null } | null
  organization?: { id: string; name: string | null; logoUrl: string | null; email: string | null } | null
  organizationName?: string | null
  organizationLogo?: string | null
  customers?: { name: string | null; email: string | null } | null
  hasServiceAgreement?: boolean | null
  serviceAgreement?: string | null
  hasPaymentTerms?: boolean | null
  paymentStructure?: string | null
  deliverables?: Array<{ id: string; name: string | null; description: string | null; dueDate: string | null; position: number | null; isPublished: boolean | null; status: string | null }>
  paymentTerms?: Array<{ id: string; name: string | null; percentage: number | null; amount: number | null; dueDate: string | null; description: string | null; status: string | null; type: string | null }>
  signatureType?: 'manual' | 'canvas' | null
  signatureDetails?: any
  signedOn?: string | null
}

export default function ProjectPreview({ projectId, token }: ProjectPreviewProps) {
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blockedReason, setBlockedReason] = useState<string | null>(null)

  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw')
  const [canvasSignature, setCanvasSignature] = useState<string>('')
  const [typedSignature, setTypedSignature] = useState<{ name: string; font: string } | null>(null)
  const isSigned = useMemo(() => Boolean(project?.signedOn), [project])
  const [isEditingAgreement, setIsEditingAgreement] = useState(false)
  const [agreementContent, setAgreementContent] = useState<string>(project?.serviceAgreement || '')
  const isAgreementLocked = useMemo(() => (project?.status || '').toLowerCase() === 'signed' || isSigned, [project, isSigned])
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (project?.serviceAgreement !== undefined) {
      setAgreementContent(project.serviceAgreement || '')
    }
  }, [project?.serviceAgreement])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`/api/projects/submit-project?projectId=${projectId}&token=${token}`)
        if (res.data?.success) {
          if (res.data.data?.state === 'draft') {
            setError('This project is in preview mode and cannot be viewed yet.')
          } else {
            // Log for debugging (browser console)
            // eslint-disable-next-line no-console
            console.log('[project-preview] data:', res.data.data)
            setProject(res.data.data)
          }
        } else {
          setError(res.data?.error || 'Failed to load project')
        }
      } catch (e: any) {
        if (e?.response?.status === 403) {
          setBlockedReason(e?.response?.data?.reason || null)
          setError(null)
        } else {
          setError(e.response?.data?.error || 'Failed to load project')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [projectId, token])

  const formatCurrency = (amount: number | null | undefined, currency: string | null | undefined) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount || 0)
  }

  const handleTypedSignature = (name: string, font: string) => {
    setTypedSignature({ name, font })
  }

  const handleSignClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmSign = async () => {
    if (!project) return
    setShowConfirmModal(false)
    try {
      const payload =
        signatureType === 'draw'
          ? { signatureType: 'canvas', signatureDetails: { dataUrl: canvasSignature } }
          : { signatureType: 'manual', signatureDetails: { name: typedSignature?.name || '', font: typedSignature?.font || '' } }

      const res = await axios.patch('/api/projects/submit-project', {
        projectId,
        token,
        serviceAgreement: agreementContent || project.serviceAgreement || '',
        ...payload,
      })
      if (res.data?.success) {
        toast.success('Project signed successfully')
        setProject((prev) => (prev ? { ...prev, signedOn: res.data.signedOn, status: 'signed', signedStatus: 'signed', signatureType: payload.signatureType, signatureDetails: (payload as any).signatureDetails, serviceAgreement: agreementContent || prev.serviceAgreement } as any : prev))
      } else {
        toast.error(res.data?.error || 'Failed to sign project')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to sign project')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  if (blockedReason) {
    return <SubscriptionNotice reason={blockedReason} />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Project not found</h1>
        </div>
      </div>
    )
  }

  const orgName = project.organization?.name || project.organizationName || 'Company'
  const logoUrl = project.organization?.logoUrl || project.organizationLogo || null
  const due = project.endDate ? format(new Date(project.endDate), 'd MMMM yyyy') : 'N/A'
  const customerName = project.customers?.name || 'Customer'

  return (
    <div className="min-h-screen md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className='shadow-xl min-h-screen shadow-black/10 border-0 overflow-hidden'>

          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-bexoni/60 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center md:gap-3 gap-1">
                  {project.organization?.logoUrl ? (
                    <img 
                      src={project.organization.logoUrl} 
                      alt={orgName} 
                      className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 object-contain" />
                  ) : project.organizationLogo ? (
                    <img 
                      src={project.organizationLogo} 
                      alt={orgName} 
                      className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 object-contain" />
                  ) : (
                    <div className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 flex items-center justify-center">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-xs md:text-base">{orgName}</h3>
                    <p className="text-blue-100 text-xs md:text-sm">Project</p>
                  </div>
                </div>
              <div className="flex items-center gap-2">
                <Badge className={`${isSigned ? 'bg-green-500/20 text-green-100 border-green-300' : 'bg-yellow-500/20 text-yellow-100 border-yellow-300'} text-xs md:text-sm`}>
                  {isSigned ? 'Signed' : 'Pending Signature'}
                </Badge>
                <Badge variant="secondary" className={`bg-white/20 text-white border-white/30 text-xs md:text-sm`}>
                  Due: {due}
                </Badge>
              </div>
            </div>
            <h1 className="md:text-3xl text-xl font-bold">{project.name || 'Project'}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Start Date: {project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : 'N/A'}</span>
              </div>
              {project.endDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>End Date: {format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Intro block matching example layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-none">
                <h3 className="font-semibold  mb-2">From:</h3>
                <p className="font-medium">{orgName}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-none">
                <h3 className="font-semibold mb-2">To:</h3>
                <p className="font-medium">{customerName}</p>
              </div>
            </div>

            {/* <div className="mb-6">
              <h3  className="font-semibold  mb-4 text-lg md:text-xl">{project.name}</h3>
              {project.description && (
                <CardDescription >{project.description}</CardDescription>
              )}
            </div> */}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle  className="font-semibold  mb-4 text-lg md:text-xl" >{project.name}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full  ">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Description</th>
                        <th className="text-left py-3 px-4 font-medium">Timeline</th>
                        <th className="text-left py-3 px-4 font-medium">Budget</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-4 ">{project.name}</td>
                        <td className="py-3 px-4">{project.startDate ? format(new Date(project.startDate), 'M/d/yyyy') : '—'}{` `}- {project.endDate ? format(new Date(project.endDate), 'M/d/yyyy') : '—'}</td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(project.budget, project.currency)}</td>
                        <td className="py-3 px-4">
                          <Badge className="capitalize">{project.status || 'pending'}</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {project.deliverables && project.deliverables.length > 0 && (
                    <>
                      <Separator className='my-4' />
                      <div>
                        <CardTitle className='px-4 pb-2'>Deliverables</CardTitle>
                        <div className="divide-y">
                          {project.deliverables.map((d) => (
                            <div key={d.id} className="flex items-start justify-between gap-3 py-4 px-4">
                              <div className="min-w-0 pr-2">
                                <div className="text-base font-semibold truncate">
                                  {d.name || 'Deliverable'}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 break-words">
                                  {d.description && d.description.trim().length > 0 
                                    ? d.description 
                                    : 'No description available'}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <span className="inline-block rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap">
                                  {d.dueDate ? format(new Date(d.dueDate), 'M/d/yyyy') : '—'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* Deliverables */}
            {/* {project.deliverables && project.deliverables.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Deliverables</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Name</th>
                          <th className="text-left py-2 px-2">Description</th>
                          <th className="text-left py-2 px-2">Due Date</th>
                          <th className="text-left py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.deliverables.map((d) => (
                          <tr key={d.id} className="border-b">
                            <td className="py-2 px-2 text-sm">{d.name}</td>
                            <td className="py-2 px-2 text-sm">{d.description}</td>
                            <td className="py-2 px-2 text-sm">{d.dueDate ? format(new Date(d.dueDate), 'd MMM yyyy') : '—'}</td>
                            <td className="py-2 px-2 text-sm capitalize">{d.status || 'pending'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Payment Terms */}
            {/* {project.hasPaymentTerms && project.paymentTerms && project.paymentTerms.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Payment Terms</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Name</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Percentage</th>
                          <th className="text-left py-2 px-2">Amount</th>
                          <th className="text-left py-2 px-2">Due Date</th>
                          <th className="text-left py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.paymentTerms.map((t) => (
                          <tr key={t.id} className="border-b">
                            <td className="py-2 px-2 text-sm">{t.name}</td>
                            <td className="py-2 px-2 text-sm capitalize">{t.type || '—'}</td>
                            <td className="py-2 px-2 text-sm">{t.percentage ?? '—'}%</td>
                            <td className="py-2 px-2 text-sm">{t.amount ? formatCurrency(t.amount, project.currency) : '—'}</td>
                            <td className="py-2 px-2 text-sm">{t.dueDate ? format(new Date(t.dueDate), 'd MMM yyyy') : '—'}</td>
                            <td className="py-2 px-2 text-sm capitalize">{t.status || 'pending'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Service Agreement with optional editing */}
            {project.hasServiceAgreement && (
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Service Agreement</CardTitle>
                  {!isAgreementLocked && (
                    <Button  variant={isEditingAgreement ? 'secondary' : 'outline'} onClick={() => setIsEditingAgreement((v) => !v)}>
                      {isEditingAgreement ? 'Close Editor' : 'Edit Agreement'}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditingAgreement && !isAgreementLocked ? (
                    <TipTapEditor content={agreementContent || ''} onChange={setAgreementContent} />
                  ) : (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: agreementContent || project.serviceAgreement || '' }} />
                  )}

                  {/* Signature lines preview with applied signature and date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 ">
                    <div className="space-y-6">
                      <div>
                        <span className="font-semibold">Date:</span>{' '}
                        <span className="ml-2 inline-block border-b w-56 align-bottom">
                          {isSigned && project.signedOn ? format(new Date(project.signedOn), 'MMMM do, yyyy h:mm a') : (!isSigned ? format(new Date(), 'MMMM do, yyyy h:mm a') : '')}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Signature:</span>{' '}
                        <span className="ml-2 inline-block border-b w-72 align-bottom">
                          {signatureType === 'draw' && !isSigned && canvasSignature && (
                            <img src={canvasSignature} alt="signature" className="h-8 inline-block object-contain" />
                          )}
                          {signatureType === 'type' && !isSigned && typedSignature?.name && <span>{typedSignature.name}</span>}
                          {isSigned && project.signatureType === 'manual' && (project as any).signatureDetails?.name && (
                            <span>{(project as any).signatureDetails.name}</span>
                          )}
                          {isSigned && project.signatureType === 'canvas' && (project as any).signatureDetails?.dataUrl && (
                            <img src={(project as any).signatureDetails.dataUrl} alt="signature" className="h-8 inline-block object-contain" />
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <span className="font-semibold">Date:</span>{' '}
                        <span className="ml-2 inline-block border-b w-56 align-bottom">
                          {format(new Date(), 'MMMM do, yyyy h:mm a')}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Signature:</span>{' '}
                        <span className="ml-2 inline-flex items-center gap-2 border-b w-72 align-bottom"></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signature Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSigned ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">Signed on {project.signedOn ? format(new Date(project.signedOn), 'd MMMM yyyy, HH:mm') : ''}</div>
                    <div className="border rounded p-4 flex items-center justify-center min-h-[120px]">
                      {project.signatureType === 'canvas' && (project as any).signatureDetails?.dataUrl && (
                        <img src={(project as any).signatureDetails.dataUrl} alt="signature" className="h-14 object-contain" />
                      )}
                      {project.signatureType === 'manual' && (project as any).signatureDetails?.name && (
                        <span className="text-xl font-medium">{(project as any).signatureDetails.name}</span>
                      )}
                    </div>
                    <div className="text-xs bg-purple-50 dark:bg-purple-900 p-2 rounded-none ">
                      Note: This template is a framework to facilitate agreement. Both parties are solely responsible for reviewing and agreeing to the contents. <Link href="https://bexforte.com" target="_blank" className='text-primary underline'>Bexforte</Link> is only a communication medium and is not a party to the agreement.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={signatureType === 'draw' ? 'default' : 'outline'}
                        onClick={() => setSignatureType('draw')}
                      >
                        Draw Signature
                      </Button>
                      <Button
                        variant={signatureType === 'type' ? 'default' : 'outline'}
                        onClick={() => setSignatureType('type')}
                      >
                        Type Signature
                      </Button>
                    </div>

                    {signatureType === 'draw' ? (
                      <SignaturePad onSignature={setCanvasSignature} onClear={() => setCanvasSignature('')} />
                    ) : (
                      <TypedSignature onSignature={handleTypedSignature} />
                    )}

                    <div className="text-xs bg-purple-50 dark:bg-purple-900 p-2 rounded-none ">
                      Note: This template is a framework to facilitate agreement. Both parties are solely responsible for reviewing and agreeing to the contents. <Link href="https://bexforte.com" target="_blank" className='text-primary underline'>Bexforte</Link> is only a communication medium and is not a party to the agreement.
                    </div>

                    <Button
                      onClick={handleSignClick}
                      disabled={
                        isSigned ||
                        (signatureType === 'draw' ? !canvasSignature : !typedSignature?.name)
                      }
                      className="w-full"
                    >
                      {isSigned ? 'Document Signed' : 'Sign Document'}
                    </Button>
                  </div>
                )}
                                                                 {/* Download Button */}
                   <div className="flex justify-center pt-4">
                     <Button
                       className="flex space-x-3 mx-2"
                       title="Download Project PDF"
                       onClick={async () => {
                         try {
                           // Use existing project data instead of making authenticated API call
                           const pdfData: ProjectPDFData = {
                             id: project.id,
                             name: project.name || 'Project',
                             description: project.description || '',
                             type: project.type || 'personal',
                             customerName: customerName,
                             organizationName: orgName,
                             organizationLogoUrl: logoUrl,
                             budget: project.budget || 0,
                             currency: project.currency || 'USD',
                             startDate: project.startDate || undefined,
                             endDate: project.endDate || undefined,
                             deliverables: (project.deliverables || [])?.map((d: any) => ({
                               name: d.name || null,
                               description: d.description || null,
                               dueDate: d.dueDate || null,
                             })),
                             serviceAgreement: project.serviceAgreement || null,
                           }
                           
                           const filename = project.name 
                             ? `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
                             : `project-${project.id}.pdf`;
                           
                           await downloadProjectAsPDF(pdfData, filename)
                           toast.success("Project PDF downloaded successfully!");
                         } catch (err) {
                           console.error('Download project PDF error:', err)
                           toast.error('Failed to generate project PDF')
                         }
                       }}
                     >
                       <HardDriveDownload className="w-3 h-3" />
                       Download Project PDF
                     </Button>
                   </div>
              </CardContent>
            </Card>

            {/* Signature Status */}
            {isSigned && project.signedOn && (
              <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-900 dark:border-green-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Document Signed Successfully</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Signed on {format(new Date(project.signedOn), 'd MMMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </div>

              
                </CardContent>
              </Card>
            )}

          </div>
        </Card>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSign}
        organizationName={orgName}
      />
    </div>
  )
}