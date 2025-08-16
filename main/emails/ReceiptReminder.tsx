import {
    Body,
    Button,
    Container,
    Column,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Row,
    Section,
    Text,
  } from "@react-email/components"
  import * as React from "react";
  import { baseUrl } from "@/utils/universal";

  interface IssueInvoiceEmailProps {
    senderName?: string
    clientName?: string
    receiptName?: string
    receiptId?: string
    logoUrl?: string
    receiptLink?: string
  }

  export default function InvoiceReminder({
    senderName = "Development Team",
    clientName = "Client",
    receiptName = "Your receipt",
    receiptId = "123",
    logoUrl = "https://www.bexoni.com/favicon.ico",
    receiptLink,
  }: IssueInvoiceEmailProps) {
    const previewText = ` ${receiptName} is.`
    const finalReceiptLink = receiptLink || `${baseUrl}/r/${receiptId}`;
  
    const logoStyle = {
      width: "48px",
      height: "48px",
      border: "2px solid #faf8f5",
      backgroundColor: "#faf8f5",
      borderRadius: "0px",
      display: "block",
    }
  
    return (
      <Html>
          <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <style>{`
            @media (prefers-color-scheme: dark) {
              .dark-mode-bg { background-color: #1f2937 !important; }
              .dark-mode-text { color: #f9fafb !important; }
              .dark-mode-border { border-color: #374151 !important; }
            }
          `}</style>
        </Head>
        <Preview>{previewText}</Preview>
        <Body style={main}>
          <Container style={container}>
            {/* Header */}
            <Section style={headerStyle}>
              <Row>
              <Column style={{ width: "48px", verticalAlign: "top" }}>
                  <Img
                    src={logoUrl}
                    alt={`${senderName} logo`}
                    style={logoStyle}
                    width="48"
                    height="48"
                  />
                </Column>
                <Column style={{ paddingLeft: "20px", verticalAlign: "top" }}>
                  <Heading as="h1" style={headerTitleStyle}>
                    Your receipt {receiptName} is ready again!
                  </Heading>
                  <Text style={headerSubtitleStyle}>
                  {receiptName} • From {senderName}
                  </Text>
                </Column>
              </Row>
            </Section>
  
            {/* Content */}
            <Section style={contentStyle}>
              <Text style={greetingStyle}>Hello {clientName},</Text>
  
              <Section style={codeBlockStyle}>
                <Text style={codeHeaderStyle}>{"You've got another mail!"}</Text>
                <Text style={codeLineStyle}>
                  {`Your receipt ${receiptName} has been ready for a while. Please take a moment to view it.`}
                </Text>
              </Section>
  
              <Button href={finalReceiptLink} style={buttonStyle}>
                View Receipt
              </Button>
  
              <Text style={signatureStyle}>
                Thanks,
                <br />
                From your friends at {senderName}
              </Text>
            </Section>
  
            {/* Footer */}
            <Section style={footerStyle}>
              <Text style={footerTextStyle}>Powered by © Bexforte 2025</Text>
              <Text style={footerTextStyle}>RPO Unversity Avenue Charlottetown PE C1A 9H6</Text>
            </Section>
          </Container>
        </Body>
      </Html>
    )
  }
  

  // Styles
  const main = {
    backgroundColor: "#faf8f5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    lineHeight: "1.5",
    margin: "0",
    padding: "0",
    WebkitTextSizeAdjust: "100%",
    msTextSizeAdjust: "100%",
  }
  
  const container = {
    maxWidth: "700px",
    margin: "0 auto",
    border: "1px solid #e8e3db",
    borderRadius: "0px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    color: "#44413f",
    backgroundColor: "#ffffff",
    msoTableLspace: "0pt",
    msoTableRspace: "0pt",
    borderCollapse: "collapse" as const,
  }
  
  const headerStyle = {
    padding: "30px",
    backgroundColor: "#9948fb", // Fallback for clients that don't support gradients
    background: "linear-gradient(135deg, #9948fb 0%, #a855f7 100%)",
    color: "#ffffff",
    position: "relative" as const,
    overflow: "hidden",
    msoTableLspace: "0pt",
    msoTableRspace: "0pt",
  }
  
  const logoContainerStyle = {
    width: "60px",
    height: "30px",
    background: "linear-gradient(135deg, #00ff00 0%, #00cc00 100%)",
    borderRadius: "0px",
  }
  
  const logoTextStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#000",
    padding: "18px 0",
    textAlign: "center" as const,
    lineHeight: "1",
  }
  
  const headerTitleStyle = {
    margin: "0 0 5px 0",
    fontSize: "18px",
    fontWeight: "600",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    color: "#ffffff",
    lineHeight: "1.3",
  }
  
  const headerSubtitleStyle = {
    margin: "0",
    opacity: "0.9",
    fontSize: "12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    color: "rgba(255, 255, 255, 0.9)",
  }
  
  const contentStyle = {
    padding: "40px",
    backgroundColor: "#ffffff",
    msoTableLspace: "0pt",
    msoTableRspace: "0pt",
  }
  
  const greetingStyle = {
    color: "#44413f",
    marginBottom: "30px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
  }
  
  const codeBlockStyle = {
    backgroundColor: "#f8f9fa",
    border: "1px solid #e8e3db",
    borderRadius: "0px",
    padding: "20px",
    margin: "20px 0",
    overflowX: "auto" as const,
    msoTableLspace: "0pt",
    msoTableRspace: "0pt",
  }
  
  const codeHeaderStyle = {
    color: "#8b949e",
    fontSize: "12px",
    marginBottom: "15px",
    paddingBottom: "8px",
    borderBottom: "1px solid #9948fb",
  }
  
  const codeLineStyle = {
    margin: "5px 0",
    display: "flex",
    alignItems: "center",
    color: "#44413f",
    fontSize: "14px",
    lineHeight: "1.6",
  }
  
  const buttonStyle = {
    display: "inline-block",
    backgroundColor: "#9948fb", // Fallback for clients that don't support gradients
    background: "linear-gradient(135deg, #9948fb 0%, #a855f7 100%)",
    color: "#ffffff",
    textDecoration: "none",
    padding: "16px 32px",
    borderRadius: "0px",
    fontSize: "14px",
    fontWeight: "600",
    margin: "30px 0",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    border: "none",
    msoHide: "all",
  }
  
  const signatureStyle = {
    marginTop: "30px",
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "left" as const,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    lineHeight: "1.5",
  }
  
  const footerStyle = {
    padding: "30px 40px",
    textAlign: "left" as const,
    backgroundColor: "#f8f9fa",
    borderTop: "1px solid #e8e3db",
    msoTableLspace: "0pt",
    msoTableRspace: "0pt",
  }
  
  const footerTextStyle = {
    margin: "5px 0",
    fontSize: "11px",
    color: "#6b7280",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    lineHeight: "1.4",
  }
    