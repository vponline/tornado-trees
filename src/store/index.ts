import { writable } from 'svelte/store';

const loading = writable<boolean>(false);
const blockNumber = writable<number | null>(null);
const averageGasPriceLastBlock = writable<number | null>(null);
const withdrawalsLength = writable<number | null>(null);
const depositsLength = writable<number | null>(null);
const lastProcessedWithdrawalLeaf = writable<number | null>(null);
const lastProcessedDepositLeaf = writable<number | null>(null);
const addressDepositTransactions = writable<{ [key: string]: string }[] | null>([]);
const addressWithdrawalTransactions = writable<{ [key: string]: string }[] | []>([]);

export {
  loading,
  blockNumber,
  withdrawalsLength,
  depositsLength,
  lastProcessedWithdrawalLeaf,
  lastProcessedDepositLeaf,
  addressDepositTransactions,
  addressWithdrawalTransactions,
  averageGasPriceLastBlock
};
