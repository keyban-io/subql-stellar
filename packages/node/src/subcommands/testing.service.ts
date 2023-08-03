// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  NodeConfig,
  TestingService as BaseTestingService,
  TestRunner,
  NestLogger,
} from '@subql/node-core';
import { SorobanBlockWrapper } from '@subql/types-soroban';
import { SubqlProjectDs, SubqueryProject } from '../configure/SubqueryProject';
import { ProjectService } from '../indexer/project.service';
import { SorobanApi, SorobanApiService } from '../soroban';
import SafeSorobanProvider from '../soroban/safe-api';
import { TestingModule } from './testing.module';
@Injectable()
export class TestingService extends BaseTestingService<
  SorobanApi,
  SafeSorobanProvider,
  SorobanBlockWrapper,
  SubqlProjectDs
> {
  constructor(
    nodeConfig: NodeConfig,
    @Inject('ISubqueryProject') project: SubqueryProject,
  ) {
    super(nodeConfig, project);
  }

  async getTestRunner(): Promise<
    TestRunner<
      SorobanApi,
      SafeSorobanProvider,
      SorobanBlockWrapper,
      SubqlProjectDs
    >
  > {
    const testContext = await NestFactory.createApplicationContext(
      TestingModule,
      {
        logger: new NestLogger(),
      },
    );

    await testContext.init();

    const projectService: ProjectService = testContext.get(ProjectService);
    const apiService = testContext.get(SorobanApiService);

    // Initialise async services, we do this here rather than in factories, so we can capture one off events
    await apiService.init();
    await projectService.init();

    return testContext.get(TestRunner);
  }
}
