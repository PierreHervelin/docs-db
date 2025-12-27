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

interface VerificationEmailProps {
  username: string
  verificationUrl: string
}

export default function VerificationEmail({ username, verificationUrl }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Vérifiez votre adresse email pour activer votre compte</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Vérification de votre compte</Heading>
          <Text style={text}>Bonjour {username},</Text>
          <Text style={text}>
            Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le bouton
            ci-dessous pour vérifier votre adresse email.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Vérifier mon email
            </Button>
          </Section>
          <Text style={text}>
            Ce lien est valide pendant 24 heures. Si vous n'avez pas créé de compte, vous pouvez
            ignorer cet email en toute sécurité.
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
