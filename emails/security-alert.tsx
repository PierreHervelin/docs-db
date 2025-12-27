import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SecurityAlertEmailProps {
  username: string
  eventType: string
  eventDetails: string
  timestamp: string
  ipAddress?: string
}

export default function SecurityAlertEmail({
  username,
  eventType,
  eventDetails,
  timestamp,
  ipAddress,
}: SecurityAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Alerte de sécurité sur votre compte</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Alerte de sécurité</Heading>
          <Text style={text}>Bonjour {username},</Text>
          <Text style={text}>Nous vous informons d'une activité importante sur votre compte :</Text>
          <Section style={alertBox}>
            <Text style={alertText}>
              <strong>Type :</strong> {eventType}
            </Text>
            <Text style={alertText}>
              <strong>Détails :</strong> {eventDetails}
            </Text>
            <Text style={alertText}>
              <strong>Date :</strong> {timestamp}
            </Text>
            {ipAddress && (
              <Text style={alertText}>
                <strong>Adresse IP :</strong> {ipAddress}
              </Text>
            )}
          </Section>
          <Text style={text}>
            Si vous êtes à l'origine de cette action, vous pouvez ignorer cet email. Si vous ne
            reconnaissez pas cette activité, nous vous recommandons de changer immédiatement votre
            mot de passe.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Pour protéger votre compte, ne partagez jamais votre mot de passe avec qui que ce soit.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
}

const alertBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '4px',
  padding: '16px',
  margin: '24px 20px',
}

const alertText = {
  color: '#856404',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 20px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 20px',
}
