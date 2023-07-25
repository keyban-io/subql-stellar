// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {forbidNonWhitelisted} from '@subql/common';
import {
  SorobanHandlerKind,
  SorobanDatasourceKind,
  SorobanEventFilter,
  SubqlCustomHandler,
  SubqlMapping,
  SubqlHandler,
  SubqlRuntimeHandler,
  SubqlRuntimeDatasource,
  SubqlCustomDatasource,
  FileReference,
  CustomDataSourceAsset,
  SubqlEventHandler,
} from '@subql/types-soroban';
import {plainToClass, Transform, Type} from 'class-transformer';
import {IsArray, IsEnum, IsInt, IsOptional, IsString, IsObject, ValidateNested} from 'class-validator';
import {SubqlSorobanProcessorOptions} from './types';

export class EventFilter implements SorobanEventFilter {
  @IsOptional()
  @IsString()
  contractId?: string;
  @IsOptional()
  @IsArray()
  topics?: string[];
}

export class EventHandler implements SubqlEventHandler {
  @forbidNonWhitelisted({topics: '', contractId: ''})
  @IsOptional()
  @ValidateNested()
  @Type(() => EventFilter)
  filter?: SorobanEventFilter;
  @IsEnum(SorobanHandlerKind, {groups: [SorobanHandlerKind.Event]})
  kind: SorobanHandlerKind.Event;
  @IsString()
  handler: string;
}

export class CustomHandler implements SubqlCustomHandler {
  @IsString()
  kind: string;
  @IsString()
  handler: string;
  @IsObject()
  @IsOptional()
  filter?: Record<string, unknown>;
}

export class SorobanMapping implements SubqlMapping {
  @Transform((params) => {
    const handlers: SubqlHandler[] = params.value;
    return handlers.map((handler) => {
      switch (handler.kind) {
        case SorobanHandlerKind.Event:
          return plainToClass(EventHandler, handler);
        default:
          throw new Error(`handler ${(handler as any).kind} not supported`);
      }
    });
  })
  @IsArray()
  @ValidateNested()
  handlers: SubqlHandler[];
  @IsString()
  file: string;
}

export class CustomMapping implements SubqlMapping<SubqlCustomHandler> {
  @IsArray()
  @Type(() => CustomHandler)
  @ValidateNested()
  handlers: CustomHandler[];
  @IsString()
  file: string;
}

export class SorobanProcessorOptions implements SubqlSorobanProcessorOptions {
  @IsOptional()
  @IsString()
  abi?: string;
  @IsOptional()
  @IsString()
  address?: string;
}

export class RuntimeDataSourceBase<M extends SubqlMapping<SubqlRuntimeHandler>> implements SubqlRuntimeDatasource<M> {
  @IsEnum(SorobanDatasourceKind, {
    groups: [SorobanDatasourceKind.Runtime],
  })
  kind: SorobanDatasourceKind.Runtime;
  @Type(() => SorobanMapping)
  @ValidateNested()
  mapping: M;
  @IsOptional()
  @IsInt()
  startBlock?: number;
  @IsOptional()
  assets?: Map<string, FileReference>;
  @IsOptional()
  @ValidateNested()
  @Type(() => SorobanProcessorOptions)
  options?: SorobanProcessorOptions;
}

export class FileReferenceImpl implements FileReference {
  @IsString()
  file: string;
}

export class CustomDataSourceBase<K extends string, M extends SubqlMapping = SubqlMapping<SubqlCustomHandler>>
  implements SubqlCustomDatasource<K, M>
{
  @IsString()
  kind: K;
  @Type(() => CustomMapping)
  @ValidateNested()
  mapping: M;
  @IsOptional()
  @IsInt()
  startBlock?: number;
  @Type(() => FileReferenceImpl)
  @ValidateNested({each: true})
  assets: Map<string, CustomDataSourceAsset>;
  @Type(() => FileReferenceImpl)
  @IsObject()
  processor: FileReference;
  @IsOptional()
  @ValidateNested()
  options?: SorobanProcessorOptions;
}
