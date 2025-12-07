import React, { useCallback, useEffect, useState } from 'react';
import Dialog, { Props as DialogProps } from '@/components/Dialog';
import StatusIcon from '../StatusIcon';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import { ConnectedWallet, usePrivy } from '@privy-io/react-auth';
import { isNormalPositive } from '@/utils/number';
import {
  encodeApproveCallData,
  encodeWithdraw,
  getUserOpByMemecore,
} from '@/libs/aa';
import axios from 'axios';
import { API_HOST_BUNDLER } from '@/configs/apiHost';
import { AVAILABLE_CHAINS } from '@/configs/chains';

export interface Props extends DialogProps {
  isShow?: boolean;
  wallet?: ConnectedWallet;
  eoaAddress?: string;
  aaAddress?: string;
  onDimClick?: () => void;
}

export default function DialogWithdraw({
  isShow,
  wallet,
  eoaAddress,
  onDimClick,
  ...props
}: Props) {
  // privy
  const { signMessage } = usePrivy();

  // state
  const [amount, setAmount] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // callback
  const handleClick = useCallback(async () => {
    if (!(wallet && eoaAddress && amount && isNormalPositive(amount, true))) {
      return;
    }

    setConfirmed(true);

    try {
      const withdrawAmount = amount;
      const callDataInfo = [
        {
          dest: '0x92574e62D8788ECC5D17F9c1bC2711673ad9f50E',
          func: await encodeApproveCallData(
            '0x6D9FfE31dFc72E4fD486Db5701F82d76Ccb1c8Ea',
            withdrawAmount,
            '6'
          ),
        },
        {
          dest: '0x6D9FfE31dFc72E4fD486Db5701F82d76Ccb1c8Ea',
          func: await encodeWithdraw(withdrawAmount, '6'),
        },
      ];
      console.log('eoaAddress', eoaAddress);
      console.log('callDataInfo', callDataInfo);
      const userOpInfo = await getUserOpByMemecore(eoaAddress, callDataInfo);
      console.log('userOpInfo', userOpInfo);
      const userOp = userOpInfo.userOp;
      const userOpByHash = userOpInfo.userOpByHash;
      const message = userOpByHash;
      console.log('message', message);

      // Metamask 연동
      const { signature } = await signMessage({ message });
      userOp.signature = signature;
      console.log('userOp.signature', userOp.signature);

      try {
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
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.log('error', error);
    }

    setConfirmed(false);
  }, [amount, eoaAddress, onDimClick, signMessage, wallet]);
  const handleDimClick = useCallback(() => {
    if (confirmed) {
      return;
    }

    onDimClick?.();
  }, [confirmed, onDimClick]);
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(event.target.value);
    },
    []
  );

  // effect
  useEffect(() => {
    setConfirmed(false);
  }, [isShow]);

  return (
    <Dialog isShow={isShow} onDimClick={handleDimClick} {...props}>
      <div className="flex flex-col gap-4 w-[300px]">
        <div className="flex flex-col font-light text-center">Withdraw</div>

        <div className="flex flex-col gap-1">
          <div className="font-light text-sm">Chain</div>
          <Select disabled={confirmed}>
            {AVAILABLE_CHAINS.map(({ id, name }) => (
              <option value={id} key={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <div className="font-light text-sm">Amount</div>
          <Input
            isNumberInput
            type="number"
            disabled={confirmed}
            value={amount}
            onChange={handleInputChange}
          />
        </div>

        <div>
          {confirmed ? (
            <div className="flex items-center justify-center pb-4">
              <StatusIcon value="progress" size="32px" />
            </div>
          ) : (
            ''
          )}

          <Button
            className="w-[100%]"
            onClick={handleClick}
            disabled={confirmed}
          >
            Withdraw
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
