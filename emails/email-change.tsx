import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface EmailChangeEmailProps {
  username: string
  newEmail: string
  verificationUrl: string
}

export default function EmailChangeEmail({
  username,
  newEmail,
  verificationUrl,
}: EmailChangeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirmez votre nouvelle adresse email</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Changement d'adresse email</Heading>
          <Text style={text}>Bonjour {username},</Text>
          <Text style={text}>
            Vous avez demandé à changer votre adresse email pour <strong>{newEmail}</strong>. Pour
            confirmer ce changement, cliquez sur le bouton ci-dessous.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Confirmer la nouvelle adresse
            </Button>
          </Section>
          <Text style={text}>
            Ce lien est valide pendant 24 heures. Si vous n'avez pas demandé ce changement, ignorez
            cet email. Votre adresse actuelle restera inchangée.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
          </Text>
          <Link href={verificationUrl} style={link}>
            {verificationUrl}
          </Link>
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
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

const link = {
  color: '#5469d4',
  fontSize: '12px',
  textDecoration: 'underline',
  margin: '0 20px',
  wordBreak: 'break-all' as const,
}
