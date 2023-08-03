// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import EventEmitter2 from 'eventemitter2';
import { SorobanApi } from './api.soroban';
import SafeSorobanProvider from './safe-api';

const HTTP_ENDPOINT = 'https://rpc-futurenet.stellar.org:443';

jest.setTimeout(60000);

const prepareSorobanApi = async function () {
  const api = new SorobanApi(HTTP_ENDPOINT, new EventEmitter2());
  await api.init();
  return api;
};

describe('SorobanApi', function () {
  let sorobanApi: SorobanApi;

  beforeEach(async function () {
    sorobanApi = await prepareSorobanApi();
  });

  it('should initialize chainId', function () {
    expect(sorobanApi.getChainId()).toEqual(
      'Test SDF Future Network ; October 2022',
    );
  });

  it('should get finalized block height', async function () {
    expect(await sorobanApi.getFinalizedBlockHeight()).not.toBeNaN();
  });

  it('should get best block height', async function () {
    expect(await sorobanApi.getBestBlockHeight()).not.toBeNaN();
  });

  it('should fetch block', async function () {
    const latestHeight = await sorobanApi.getFinalizedBlockHeight();
    const block = (await sorobanApi.fetchBlocks([latestHeight]))[0];
    expect(block.block.ledger).toEqual(latestHeight);
  });

  it('throws error if getEvents throws error', async function () {
    jest
      .spyOn(sorobanApi, 'getEvents')
      .mockImplementation(() => Promise.reject(new Error('Test error')));
    await expect(sorobanApi.fetchBlock(1)).rejects.toThrow('Test error');
  });

  it('should return safe api instance', function () {
    const height = 1;
    const safeApi = sorobanApi.getSafeApi(height);
    expect(safeApi).toBeInstanceOf(SafeSorobanProvider);
  });

  it('should throw on calling connect', async function () {
    await expect(sorobanApi.connect()).rejects.toThrow('Not implemented');
  });

  it('should throw on calling disconnect', async function () {
    await expect(sorobanApi.disconnect()).rejects.toThrow('Not implemented');
  });

  it('handleError - pruned node errors', function () {
    const error = new Error('start is before oldest ledger');
    const handled = sorobanApi.handleError(error, 1000);
    expect(handled.message).toContain(
      'The requested ledger number 1000 is not available on the current blockchain node',
    );
  });

  it('handleError - non pruned node errors should return the same error', function () {
    const error = new Error('Generic error');
    const handled = sorobanApi.handleError(error, 1000);
    expect(handled).toBe(error);
  });

  it('should get runtime chain', function () {
    const runtimeChain = sorobanApi.getRuntimeChain();
    expect(runtimeChain).toEqual((sorobanApi as any).name);
  });

  it('should return chainId for genesis hash', function () {
    const genesisHash = sorobanApi.getGenesisHash();
    expect(genesisHash).toEqual(sorobanApi.getChainId());
  });

  it('should get spec name', function () {
    const specName = sorobanApi.getSpecName();
    expect(specName).toEqual('Soroban');
  });

  it('should get client for api', function () {
    const apiClient = sorobanApi.api;
    expect(apiClient).toEqual((sorobanApi as any).client);
  });
});
