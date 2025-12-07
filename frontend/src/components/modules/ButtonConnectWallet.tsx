'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Button from '../Button';
import { IconWallet } from '../icons';
import DialogConnectWallet from '../dialogs/DialogConnectWallet';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { address2shorted } from '@/utils/format';
import DialogDisconnectWallet from '../dialogs/DialogDisconnectWallet';

export default function ButtonConnectWallet() {
  // privy
  const { wallets } = useWallets();
  const { ready, authenticated, user } = usePrivy();

  // state
  const [isShowConnect, setIsShowConnect] = useState(false);
  const [isShowDisconnect, setIsShowDisconnect] = useState(false);

  // memo
  const isConnected = useMemo(
    () => !!(wallets[0] && user && ready && authenticated),
    [user, wallets, ready, authenticated]
  );

  // callback
  const handleClick = useCallback(() => {
    if (isConnected) {
      setIsShowDisconnect(true);
    } else {
      setIsShowConnect(true);
    }
  }, [isConnected]);
  const handleClose = useCallback(() => {
    setIsShowConnect(false);
    setIsShowDisconnect(false);
  }, []);

  return (
    <>
      <Button onClick={handleClick}>
        {isConnected ? (
          address2shorted(wallets[0].address)
        ) : (
          <>
            Connect wallet <IconWallet color="#fff" size="16px" />
          </>
        )}
      </Button>

      <DialogConnectWallet isShow={isShowConnect} onDimClick={handleClose} />
      <DialogDisconnectWallet
        isShow={isShowDisconnect}
        onDimClick={handleClose}
      />
    </>
  );
}
