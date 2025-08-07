import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Html,
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
  invoiceName?: string

  invoiceId?: string
  logoUrl?: string
}

export default function IssueInvoice({
  senderName = "Development Team",
  clientName = "Client",
  invoiceName = "Your Invoice",
  invoiceId = "123",

  logoUrl = "https://www.bexoni.com/favicon.ico",
}: IssueInvoiceEmailProps) {
  const previewText = ` ${invoiceName} has been initiated.`
  const invoiceLink = `${baseUrl}/i/${invoiceId}`;

  const logoStyle = {
    width: "48px",
    height: "48px",
    border: "2px solid #faf8f5",
    backgroundColor: "#faf8f5",
    backgroundImage: `url(${logoUrl})`,
    backgroundPosition: "center ",
    backgroundSize: "contain", // Changed to 'cover' to fill the circle
    backgroundRepeat: "no-repeat",
    overflow: "hidden",

    display: "flex",
    alignItems: "center",
    justifyContent: "center", 
  }

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerStyle}>
            <Row>
              <Column>
                <Section style={logoStyle} />
              </Column>
              <Column style={{ paddingLeft: "20px" }}>
                <Heading as="h1" style={headerTitleStyle}>
                  Your Invoice Is Underway!
                </Heading>
                <Text style={headerSubtitleStyle}>
                  {invoiceName} • From {senderName}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Hello {clientName},</Text>

            <Section style={codeBlockStyle}>
              <Text style={codeHeaderStyle}>{"You've got mail!"}</Text>
              <Text style={codeLineStyle}>
                {"We're pleased to inform you that your invoice " +
                  invoiceName +
                  " has been initiated. Please click the button below to view it."}
              </Text>
            </Section>

            <Button href={invoiceLink} style={buttonStyle}>
              View Invoice
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
  fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  lineHeight: "1.5",
}

const container = {
  maxWidth: "700px",
  margin: "0 auto",
  border: "1px solid #e8e3db",
  borderRadius: "0px",
  overflow: "hidden",
  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
  color: "#44413f",
}

const headerStyle = {
  padding: "30px",
  background: "linear-gradient(135deg, #9948fb 0%, #a855f7 100%)",
  color: "#e0e0e0",
  position: "relative" as const,
  overflow: "hidden",
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
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  color: "#e0e0e0",
}

const headerSubtitleStyle = {
  margin: "0",
  opacity: "0.8",
  fontSize: "12px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const contentStyle = {
  padding: "40px",
  backgroundColor: "#faf8f5",
}

const greetingStyle = {
  color: "#8b949e",
  marginBottom: "30px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: "14px",
}

const codeBlockStyle = {
  background: "#fff",
  border: "1px solid #e8e3db",
  borderRadius: "0px",
  padding: "20px",
  margin: "20px 0",
  overflowX: "auto" as const,
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
  display: "block",
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
  letterSpacing: "2px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  border: "1px solid #9948fb",
}

const signatureStyle = {
  marginTop: "30px",
  fontSize: "12px",
  color: "#8b949e",
  textAlign: "left" as const,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const footerStyle = {
  padding: "30px 40px",
  textAlign: "left" as const,
  backgroundColor: "#f5f2ed",
  borderTop: "1px solid #e8e3db",
}

const footerTextStyle = {
  margin: "5px 0",
  fontSize: "11px",
  color: "#8b949e",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}
  