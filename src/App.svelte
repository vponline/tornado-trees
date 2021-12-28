<script lang="ts">
  import { ethers, BigNumber } from 'ethers';
  import {
    loading,
    blockNumber,
    withdrawalsLength,
    depositsLength,
    lastProcessedWithdrawalLeaf,
    lastProcessedDepositLeaf,
    addressDepositTransactions,
    addressWithdrawalTransactions,
    averageGasPriceLastBlock,
  } from './store/index';
  import {
    tornadoTreesAddress,
    TornadoTreesAbi,
    tornadoDepositAddresses,
    tornadoAddressAssetMap,
    tornadoDepositENS,
  } from './constants';
  import Spinner from './components/Spinner.svelte';
  import Skeleton from './components/Skeleton.svelte';
  import * as env from '../env.json';

  const config: { ETHERSCAN_ID?: string; INFURA_ID?: string } = env;
  if (!config.ETHERSCAN_ID || !config.INFURA_ID)
    console.error('Missing env, check that env.json file contains: { ETHERSCAN_ID, INFURA_ID }');

  const ETHERSCAN_ID = config.ETHERSCAN_ID; //default etherscan id
  const INFURA_ID = config.INFURA_ID; //default infura id

  const formattedTornadoAddressAssetMap = Object.keys(tornadoAddressAssetMap).reduce((acc: any, address: any) => {
    const addressItem = { [address.toLowerCase()]: tornadoAddressAssetMap[address] };
    return { ...acc, ...addressItem };
  }, {});

  const formattedTornadoDeposiAddressArray = tornadoDepositAddresses.map((address) => address.toLowerCase());

  const ethereumProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`);
  const tornadoTreesContract = new ethers.Contract(tornadoTreesAddress, TornadoTreesAbi, ethereumProvider);

  ///
  const getBlockWithTransactions = async (blockHashOrBlockTag: string) => {
    try {
      const data = await ethereumProvider.getBlockWithTransactions(blockHashOrBlockTag);
      console.log('getBlockTransactions', data);
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  //Gas price calculator
  const calculateLastBlockAverageGasPrice = async () => {
    const latestBlockWithTransactions = await getBlockWithTransactions('latest');
    const transactionCount = latestBlockWithTransactions.transactions.length;
    const sumGasPrices = latestBlockWithTransactions.transactions.reduce((acc, tx) => {
      // let formattedGasPrice = 0
      // if (tx.gasPrice) {
      // 	formattedGasPrice = tx.gasPrice.toNumber()
      // 	// console.log("formattedGasPrice",formattedGasPrice)
      // }

      return acc.add(tx.gasPrice);
    }, BigNumber.from(0));

    // let sumGasPrices = BigNumber.from(0)
    // latestBlockWithTransactions.transactions.forEach(tx => sumGasPrices.add(tx.gasPrice))
    const averageGasPrice = ethers.utils.formatUnits(sumGasPrices, 'gwei') / transactionCount;

    return averageGasPrice;
  };
  ///

  const getData = async () => {
    $blockNumber = await getBlockNumber();
    $lastProcessedDepositLeaf = await getLastProcessedDepositLeaf();
    $lastProcessedWithdrawalLeaf = await getLastProcessedWithdrawalLeaf();
    $withdrawalsLength = await getWithdrawalsLength();
    $depositsLength = await getDepositsLength();
    $averageGasPriceLastBlock = Math.round(await calculateLastBlockAverageGasPrice());
    // getEtherscanData(formattedTornadoDeposiAddressArray[0])
  };

  const getBlockNumber = async () => {
    try {
      const data = await ethereumProvider.getBlockNumber();
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  const getLastProcessedWithdrawalLeaf = async () => {
    try {
      const data = await tornadoTreesContract.lastProcessedWithdrawalLeaf();
      return data.toNumber();
    } catch (error) {
      console.error(error);
    }
  };

  const getWithdrawalsLength = async () => {
    try {
      const data = await tornadoTreesContract.withdrawalsLength();
      return data.toNumber();
    } catch (error) {
      console.error(error);
    }
  };

  const getLastProcessedDepositLeaf = async () => {
    try {
      const data = await tornadoTreesContract.lastProcessedDepositLeaf();
      return data.toNumber();
    } catch (error) {
      console.error(error);
    }
  };

  const getDepositsLength = async () => {
    try {
      const data = await tornadoTreesContract.depositsLength();
      return data.toNumber();
    } catch (error) {
      console.error(error);
    }
  };

  $: getData();
  // $: setInterval(() => getData(), 10000)
  // $: setInterval(() => calculateLastBlockAverageGasPrice(), 3000)

  const getEtherscanData = async (addressInput: string) => {
    $loading = true;
    $addressDepositTransactions = [];
    $addressWithdrawalTransactions = [];

    try {
      // const etherscanProvider = new ethers.providers.EtherscanProvider();
      // getHistory doesnt return internal txs
      // const history = await etherscanProvider.getHistory(addressInput);
      const normalTxResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${addressInput}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_ID}`,
      );
      const { result: normalTxData } = await normalTxResponse.json();

      const internalTxResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${addressInput}&sort=asc&apikey=${ETHERSCAN_ID}`,
      );
      const { result: internalTxData } = await internalTxResponse.json();

      // Need to check deposits form internal txs?
      const transactionArray = normalTxData.concat(internalTxData);

      const deposits = transactionArray.filter(
        (tx) => formattedTornadoDeposiAddressArray.includes(tx.to) && tx.value !== '0',
      );
      const withdrawals = transactionArray.filter((tx) => formattedTornadoDeposiAddressArray.includes(tx.from));

      $addressDepositTransactions = deposits;
      $addressWithdrawalTransactions = withdrawals;
    } catch (error) {
      console.error(error);
    } finally {
      $loading = false;
    }
  };

  const getEtherscanLogs = async (e: Event, address: string, topic: string, blockNumber: number) => {
    e.preventDefault();
    try {
      const response = await fetch(`
			https://api.etherscan.io/api?module=logs&action=getLogs
			&fromBlock=${blockNumber}
			&toBlock=${blockNumber}
			&address=${address}
			&topic0=${'0xa945e51eec50ab98c161376f0db4cf2aeba3ec92755fe2fcd388bdbbb80ff196'}
			&apikey=${ETHERSCAN_ID}`);
      const data = await response.json();
      console.log('transaction details', data);
    } catch (error) {
      console.error(error);
    }
  };

  let addressInput: string = '';
  const handleSearchAddress = async (e: Event, addressInput: string) => {
    e.preventDefault();
    getEtherscanData(addressInput);
  };
</script>

<main>
  <div class="top-container">
    <h1>Tornado Trees</h1>
    <div class="info-text">
      <span class="text-light">Proxy contract: </span>
      <a class="info-content" href={`https://etherscan.io/address/${tornadoTreesAddress}`}>{tornadoTreesAddress}</a>
    </div>
    <div class="info-text">
      <span class="text-light">Block: </span>
      {#if $blockNumber}
        <span class="info-content">{$blockNumber}</span>
      {:else}
        <Skeleton />
      {/if}
    </div>
    <div class="info-text">
      <span class="text-light">Average Gas Price: </span>
      {#if $averageGasPriceLastBlock}
        <span class="info-content">{$averageGasPriceLastBlock}</span>
      {:else}
        <Skeleton />
      {/if}
    </div>
    <div class="info-text">
      <span class="text-light">Total Withdrawals: </span>
      {#if $withdrawalsLength}
        <span class="info-content">{$withdrawalsLength}</span>
      {:else}
        <Skeleton />
      {/if}
    </div>
    <div class="info-text">
      <span class="text-light">Total Deposits: </span>
      {#if $depositsLength}
        <span class="info-content">{$depositsLength}</span>
      {:else}
        <Skeleton />
      {/if}
    </div>
    <div class="info-text">
      <span class="text-light">Last Processed Withdrawal Leaf: </span>
      {#if $lastProcessedWithdrawalLeaf}
        <span class="info-content">{$lastProcessedWithdrawalLeaf}</span>
      {:else}
        <Skeleton />
      {/if}
    </div>
    <div class="info-text">
      <span class="text-light">Last Processed Deposit Leaf: </span>
      {#if $lastProcessedDepositLeaf}
        <span class="info-content">{$lastProcessedDepositLeaf}</span>
      {:else}
        <Skeleton />
      {/if}
    </div>
  </div>

  <div class="form-container">
    <form>
      <input bind:value={addressInput} placeholder="Address" type="text" id="address" name="address" required />
      <button on:click={(e) => handleSearchAddress(e, addressInput.toLowerCase())}>Search</button>
    </form>
    <span class="text-light-grey" on:click={() => (addressInput = '0xabf84116200e0a67D4d6673f6acE1dA3f8A216F3')}
      >Try: <span class="text-underline">0xabf84116200e0a67D4d6673f6acE1dA3f8A216F3</span></span
    >
    {#if $loading}
      <div class="loading-div">
        <Spinner />
      </div>
    {/if}
    <div class="transactions-container">
      {#if $addressDepositTransactions.length}
        <div class="transactions-inner">
          <p>Total deposits: {$addressDepositTransactions.length}</p>
          {#each $addressDepositTransactions as transaction, index}
            <div class="transactions-content">
              <p>
                <span class="text-light">{index + 1}:</span>
                {ethers.utils.formatUnits(transaction.value, 'ether')}
                {formattedTornadoAddressAssetMap[transaction.to]}
                <a href={`https://etherscan.io/tx/${transaction.hash}`} rel="noopener noreferrer" target="_blank"
                  >{transaction.hash.substring(0, 20)}...</a
                >
              </p>
              <button
                on:click={(e) =>
                  getEtherscanLogs(e, transaction.to, transaction.input, parseInt(transaction.blockNumber))}
                >Details</button
              >
            </div>
          {/each}
        </div>
      {:else}
        <p>No Deposits</p>
      {/if}
      {#if $addressWithdrawalTransactions.length}
        <div class="transactions-inner">
          <p>Total withdrawals: {$addressWithdrawalTransactions.length}</p>
          {#each $addressWithdrawalTransactions as transaction, index}
            <div class="transactions-content">
              <p>
                <span class="text-light">{index + 1}:</span>
                {ethers.utils.formatUnits(transaction.value, 'ether')}
                {formattedTornadoAddressAssetMap[transaction.from]}
                <a href={`https://etherscan.io/tx/${transaction.hash}`} rel="noopener noreferrer" target="_blank"
                  >{transaction.hash.substring(0, 20)}...</a
                >
              </p>
              <button
                on:click={(e) =>
                  getEtherscanLogs(e, transaction.from, transaction.input, parseInt(transaction.blockNumber))}
                >Details</button
              >
            </div>
          {/each}
        </div>
      {:else}
        <p>No Withdrawals</p>
      {/if}
    </div>
  </div>
</main>

<style>
  :global(html) {
    background-color: #000403;
  }

  main {
    /* text-align: center; */
    padding: 1rem 3rem;
    max-width: 930px;
    margin: 0 auto;
  }

  h1 {
    color: #94febf;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
    margin: 0;
  }

  .info-text {
    margin: 5px 0;
    color: #eee;
    display: flex;
    flex-direction: row;
  }

  p {
    color: #eee;
  }

  .info-content {
    margin-left: 5px;
  }

  a {
    color: #94febf;
    word-break: break-all;
  }

  button {
    background-color: #0e1f17;
    border: 1px solid #94febf;
    border-radius: 4px;
    color: #94febf;
    cursor: pointer;
  }

  button:hover {
    background-color: #94febf;
    color: #0e1f17;
    transition: all 0.15s;
  }

  input {
    background-color: transparent;
    border: 1px solid #393939;
    border-radius: 4px;
    color: #eee;
    padding: 5px 10px;
    min-width: 300px;
  }

  input:active,
  input:focus-visible {
    border: 1px solid #94febf;
    outline: none;
    outline-offset: none;
  }

  input::placeholder {
    color: #393939;
  }

  .text-light {
    font-weight: lighter;
  }

  .text-light-grey {
    color: #686868;
  }

  .text-underline {
    text-decoration: underline;
    cursor: pointer;
  }

  .loading-div {
    margin: 10px auto;
  }

  .transactions-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    max-width: 900px;
    gap: 2rem;
  }

  .transactions-inner {
    display: flex;
    flex-direction: column;
    width: 100%;
    /* max-height: 300px;
		overflow: auto; */
  }

  .transactions-content {
    display: grid;
    grid-template-columns: 1fr 0.25fr;
    max-width: 450px;
  }

  .top-container,
  .form-container {
    margin: 1rem 0;
  }

  @media (max-width: 640px) {
    main {
      max-width: none;
      padding: 10px 10px;
    }

    .transactions-container {
      display: flex;
      flex-direction: column;
    }
  }
</style>
