import { Box, Spinner, Container } from '@cloudscape-design/components';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export function LoadingScreen({ 
  message = 'Starting application...', 
  subMessage = 'Please wait while we connect to the backend services.'
}: LoadingScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        zIndex: 9999,
      }}
    >
      <Container>
        <Box padding={{ vertical: 'xxxl', horizontal: 'xl' }} textAlign="center">
          <Spinner size="large" />
          <Box variant="h1" padding={{ top: 'l' }}>
            {message}
          </Box>
          <Box variant="p" color="text-body-secondary" padding={{ top: 's' }}>
            {subMessage}
          </Box>
          <Box variant="small" color="text-status-info" padding={{ top: 'm' }}>
            💡 Tip: The backend Lambda functions are warming up. This is normal on first start.
          </Box>
        </Box>
      </Container>
    </div>
  );
}
