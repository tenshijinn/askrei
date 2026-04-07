import { FC, ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, base, optimism } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';

import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'Rei',
  projectId: 'rei-ai-agent',
  chains: [mainnet, polygon, arbitrum, base, optimism],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
  ssr: false,
});

export const EVMWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: 'hsl(var(--primary))',
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
};
