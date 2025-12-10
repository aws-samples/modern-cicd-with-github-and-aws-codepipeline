import { ReactNode } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import TopNavigation from '@cloudscape-design/components/top-navigation';

interface MainLayoutProps {
  children: ReactNode;
  hotelName: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, hotelName }) => {
  return (
    <>
      <TopNavigation
        identity={{
          href: '/',
          title: hotelName,
        }}
        utilities={[
          {
            type: 'button',
            text: 'Documentation',
            href: 'https://github.com/aws-samples/modern-cicd-with-github-and-aws-codepipeline',
            external: true,
            externalIconAriaLabel: ' (opens in a new tab)',
          },
        ]}
      />
      <AppLayout
        navigationHide
        toolsHide
        content={children}
        contentType="default"
      />
    </>
  );
};
