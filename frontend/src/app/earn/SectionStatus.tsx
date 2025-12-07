'use client';

import Button from '@/components/Button';
import Card from '@/components/Card';
import DialogStake from '@/components/dialogs/DialogStake';
import DialogWithdraw from '@/components/dialogs/DialogWithdraw';
import { formatCommas } from '@/utils/format';
import { ConnectedWallet } from '@privy-io/react-auth';
import BN from 'bignumber.js';
import { useCallback, useMemo, useState } from 'react';

export interface Props {
  wallet?: ConnectedWallet;
  eoaAddress?: string;
  aaAddress?: string;
  balanceEthereumUsdc?: string;
  balanceBaseUsdc?: string;
  balanceMemecoreOsyusd?: string;
  balanceMemecoreUsdc?: string;
}

export default function SectionStatus({
  wallet,
  eoaAddress,
  aaAddress,
  balanceEthereumUsdc,
  balanceBaseUsdc,
  balanceMemecoreOsyusd,
  balanceMemecoreUsdc,
}: Props) {
  // state
  const [isShowDialogStake, setIsShowDialogStake] = useState(false);
  const [isShowDialogWithdraw, setIsShowDialogWithdraw] = useState(false);

  // memo
  const balanceMemecoreOsyusdAmount = useMemo(
    () =>
      formatCommas(
        new BN(balanceMemecoreOsyusd ?? '0').toFixed(1, BN.ROUND_HALF_UP),
        6
      ),
    [balanceMemecoreOsyusd]
  );
  const balanceEthereumUsdcAmount = useMemo(
    () => formatCommas(new BN(balanceEthereumUsdc ?? '0'), 6),
    [balanceEthereumUsdc]
  );
  const balanceBaseUsdcAmount = useMemo(
    () => formatCommas(new BN(balanceBaseUsdc ?? '0'), 6),
    [balanceBaseUsdc]
  );
  const balanceMemecoreUsdcAmount = useMemo(
    () => formatCommas(new BN(balanceMemecoreUsdc ?? '0'), 6),
    [balanceMemecoreUsdc]
  );

  // callback
  const handleStakeClick = useCallback(() => {
    setIsShowDialogStake(true);
  }, []);
  const handleStakeClose = useCallback(() => {
    setIsShowDialogStake(false);
  }, []);
  const handleWithdrawClick = useCallback(() => {
    setIsShowDialogWithdraw(true);
  }, []);
  const handleWithdrawClose = useCallback(() => {
    setIsShowDialogWithdraw(false);
  }, []);

  return (
    <div className="flex flex-col gap-[24px] items-end min-w-[450px]">
      <Card className="w-[100%]">
        <div className="flex flex-col gap-[24px] justify-center">
          <div>
            USDC <span className="text-xs font-light">on Memecore</span>:{' '}
            <span className="font-bold">{balanceMemecoreUsdcAmount} USDC</span>
          </div>
          <div>
            USDC <span className="text-xs font-light">on Ethereum</span>:{' '}
            <span className="font-bold">{balanceEthereumUsdcAmount} USDC</span>
          </div>
          <div>
            USDC <span className="text-xs font-light">on Base</span>:{' '}
            <span className="font-bold">{balanceBaseUsdcAmount} USDC</span>{' '}
          </div>
          <div>
            Staked:{' '}
            <span className="font-bold">
              {balanceMemecoreOsyusdAmount} osyUSD
            </span>{' '}
          </div>
        </div>
      </Card>

      <div className="flex gap-[24px] items-center justify-center">
        <Button onClick={handleStakeClick}>Stake</Button>
        <Button onClick={handleWithdrawClick}>Withdraw</Button>
      </div>

      <DialogStake
        isShow={isShowDialogStake}
        wallet={wallet}
        eoaAddress={eoaAddress}
        aaAddress={aaAddress}
        balanceMemecoreUsdc={balanceMemecoreUsdc}
        onDimClick={handleStakeClose}
      />
      <DialogWithdraw
        isShow={isShowDialogWithdraw}
        wallet={wallet}
        eoaAddress={eoaAddress}
        aaAddress={aaAddress}
        onDimClick={handleWithdrawClose}
      />
    </div>
  );
}
