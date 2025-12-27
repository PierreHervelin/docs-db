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

interface PasswordResetEmailProps {
  username: string
  resetUrl: string
}

export default function PasswordResetEmail({ username, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Réinitialisez votre mot de passe</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Réinitialisation de mot de passe</Heading>
          <Text style={text}>Bonjour {username},</Text>
          <Text style={text}>
            Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton
            ci-dessous pour définir un nouveau mot de passe.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Réinitialiser mon mot de passe
            </Button>
          </Section>
          <Text style={text}>
            Ce lien est valide pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation,
            ignorez cet email. Votre mot de passe actuel reste inchangé.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
          </Text>
          <Link href={resetUrl} style={link}>
            {resetUrl}
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
