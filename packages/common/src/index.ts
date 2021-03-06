import type { Ipfs } from "ipfs";
import type CID from "cids";

export interface IContext {
  ipfs?: Ipfs;
}

export interface IPinning {
  id: string;
  open(): Promise<void>;
  close(): Promise<void>;
  pin(cid: CID): Promise<void>;
  unpin(cid: CID): Promise<void>;
  ls(): Promise<CidList>;
  info(): Promise<PinningInfo>;
}

export interface IPinningStatic {
  designator: string;
  build(connectionString: string, context: IContext): Promise<IPinning>;
}

export type CidString = string;
export type Designator = string;
export type CidList = Record<CidString, Designator[]>;

export type PinningInfo = Record<string, any>;
