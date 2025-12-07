import React, { useCallback, useEffect, useState } from 'react';
import Dialog, { Props as DialogProps } from '@/components/Dialog';
import StatusIcon from '../StatusIcon';
import Button from '../Button';
import { ConnectedWallet, usePrivy } from '@privy-io/react-auth';
import {
  encodeApproveCallData,
  encodeDeposit,
  getUserOpByMemecore,
} from '@/libs/aa';
import axios from 'axios';
import { isNormalPositive } from '@/utils/number';
import { API_HOST_BUNDLER } from '@/configs/apiHost';

export interface Props extends DialogProps {
  isShow?: boolean;
  wallet?: ConnectedWallet;
  eoaAddress?: string;
  aaAddress?: string;
  balanceMemecoreUsdc?: string;
  onDimClick?: () => void;
}

export default function DialogStake({
  isShow,
  wallet,
  eoaAddress,
  balanceMemecoreUsdc,
  onDimClick,
  ...props
}: Props) {
  // privy
  const { signMessage } = usePrivy();

  // state
  const [confirmed, setConfirmed] = useState(false);

  // callback
  const handleClick = useCallback(async () => {
    if (
      !(
        wallet &&
        eoaAddress &&
        balanceMemecoreUsdc &&
        isNormalPositive(balanceMemecoreUsdc, true)
      )
    ) {
      return;
    }

    setConfirmed(true);

    // try {
    const depositAmount = balanceMemecoreUsdc;
    console.log('depositAmount', depositAmount);
    const callDataInfo = [
      {
        dest: '0x92574e62D8788ECC5D17F9c1bC2711673ad9f50E',
        func: await encodeApproveCallData(
          '0x6D9FfE31dFc72E4fD486Db5701F82d76Ccb1c8Ea',
          depositAmount,
          '6'
        ),
      },
      {
        dest: '0x6D9FfE31dFc72E4fD486Db5701F82d76Ccb1c8Ea',
        func: await encodeDeposit(depositAmount, '6'),
      },
    ];
    console.log('eoaAddress', eoaAddress);
    console.log('callDataInfo', callDataInfo);
    const userOpInfo = await getUserOpByMemecore(eoaAddress, callDataInfo);
    console.log('userOpInfo', userOpInfo);
    const userOp = userOpInfo.userOp;
    const userOpByHash = userOpInfo.userOpByHash as string;
    const message = userOpByHash;
    console.log('message', message);

    // Metamask 연동
    const { signature } = await signMessage({ message });
    userOp.signature = signature;
    console.log('userOp.signature', userOp.signature);

    // try {
    const requestBody = {
      userOp: userOp,
      entryPointInput: '0x', // EntryPoint 컨트랙트 주소
    };

    const response = await axios.post(
      `${API_HOST_BUNDLER}/sendUserOperation`,
      requestBody
    );
    console.log('Response:', response.data);

    onDimClick?.();
    //   } catch (error) {
    //     throw error;
    //   }
    // } catch (error) {
    //   console.error('error', error);
    // }

    setConfirmed(false);
  }, [balanceMemecoreUsdc, eoaAddress, onDimClick, signMessage, wallet]);
  const handleDimClick = useCallback(() => {
    if (confirmed) {
      return;
    }

    onDimClick?.();
  }, [confirmed, onDimClick]);

  // effect
  useEffect(() => {
    setConfirmed(false);
  }, [isShow]);

  return (
    <Dialog isShow={isShow} onDimClick={handleDimClick} {...props}>
      <div className="flex flex-col gap-4 w-[300px]">
        <div className="flex flex-col font-light text-center">
          {confirmed
            ? 'Waiting for wallet confirmation'
            : 'Do you want to stake ?'}

          {confirmed ? (
            <div className="pt-4">
              <StatusIcon value="progress" size="32px" />
            </div>
          ) : (
            ''
          )}
        </div>

        <Button className="w-[100%]" onClick={handleClick} disabled={confirmed}>
          Stake now
        </Button>
      </div>
    </Dialog>
  );
}
