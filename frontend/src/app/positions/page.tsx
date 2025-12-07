'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CurrentStatus from './CurrentStatus';
import RebalanceHistory from './RebalanceHistory';
import { formatCommas, formatUnit } from '@/utils/format';
import { isNormalPositive } from '@/utils/number';
import { API_HOST_API } from '@/configs/apiHost';
import SYNC_TERM from '@/configs/term';
import axios from 'axios';
import History from '@/types/History';
import { getApr } from '@/libs/aa';

export default function Positions() {
  // state
  const [apr, setApr] = useState('0');
  const [apyHistories, setApyHistories] = useState<
    {
      chainId: number;
      apy: number;
      supply: number;
      timestamp: number;
    }[]
  >([]);
  const [rebalanceHistories, setRebalanceHistories] = useState<History[]>([]);

  // memo
  const totalAverageApy = useMemo(
    () => (isNormalPositive(apr, true) ? apr : '0'),
    [apr]
  );

  // callback
  const syncApr = useCallback(async () => {
    const result = await getApr();
    console.log(result, formatCommas(formatUnit(result, 16), 6));
    setApr(formatCommas(result, 6));
  }, []);
  const syncApyHistories = useCallback(async () => {
    const { data: apyHistories } = await axios.get<{
      data: {
        _id: string;
        chainId: string;
        oldSupply: string;
        newSupply: string;
        oldAPR: string;
        newAPR: string;
        txHash: string;
        blockNumber: number;
        createdAt: string;
        updatedAt: string;
        __v: number;
      }[];
    }>(`${API_HOST_API}/events/updated-interest`);
    setApyHistories(
      apyHistories.data.map(({ chainId, newSupply, newAPR, updatedAt }) => ({
        chainId: Number(chainId),
        apy: parseFloat(newAPR),
        supply: parseFloat(newSupply),
        timestamp: new Date(updatedAt).getTime(),
      }))
    );
  }, []);
  const syncRebalanceHistories = useCallback(async () => {
    const { data: rebalanceHistories } = await axios.get<{
      data: {
        _id: string;
        srcChainId: string;
        dstChainId: string;
        amount: string;
        txHash: string;
        blockNumber: number;
        createdAt: string;
        updatedAt: string;
        __v: number;
      }[];
    }>(`${API_HOST_API}/events/rebalanced`);
    setRebalanceHistories(
      rebalanceHistories.data.map(
        ({ srcChainId, dstChainId, amount, txHash, updatedAt }) => ({
          txHash,
          from: { chain: Number(srcChainId), dex: 0 },
          to: { chain: Number(dstChainId), dex: 0 },
          amount: formatUnit(amount, 6).toFixed(6),
          time: new Date(updatedAt).getTime(),
        })
      )
    );
  }, []);

  // effect
  useEffect(() => {
    syncApr();
    syncApyHistories();
    syncRebalanceHistories();

    const intervalId = setInterval(async () => {
      syncApr();
      syncApyHistories();
      syncRebalanceHistories();
    }, SYNC_TERM);

    return () => clearInterval(intervalId);
  }, [syncApr, syncApyHistories, syncRebalanceHistories]);

  return (
    <section className="flex flex-col gap-[128px] row-start-2 items-center justify-center">
      <h1 className="text-xl font-light">
        Total Average APY{' '}
        <span className="text-4xl font-normal">
          {formatCommas(totalAverageApy)}
        </span>
        %
      </h1>

      <div className="flex flex-col gap-[64px] items-center justify-center w-[900px] font-light">
        <div className="w-[100%]">
          <CurrentStatus histories={apyHistories} />
        </div>

        <div className="w-[100%]">
          <RebalanceHistory histories={rebalanceHistories} />
        </div>
      </div>
    </section>
  );
}
