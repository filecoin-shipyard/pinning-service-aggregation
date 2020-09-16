import {
  PinningAggregation,
  UnknownPinningService,
} from "./pinning-aggregation";
import { IpfsPinning } from "./ipfs-pinning";
import { PowergatePinning } from "./powergate-pinning";
import { IPinning } from "./pinning.interface";
import CID from "cids";
import { IContext } from "./context.interface";
const cid = new CID("QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D");

const context = ({
  ipfs: jest.fn(),
} as unknown) as IContext;

const token = "p0W3R9473_70K3N";
const doubleFakeConnectionStrings = ["fake://alpha.com", "fake://beta.com"];

class FakePinning implements IPinning {
  static designator = "fake";

  static async build(): Promise<FakePinning> {
    return new FakePinning();
  }

  async close(): Promise<void> {
    // Do Nothing
  }

  async open(): Promise<void> {
    // Do Nothing
  }

  async pin(): Promise<void> {
    // Do Nothing
  }

  async unpin(): Promise<void> {
    // Do Nothing
  }
}

describe("constructor", () => {
  test("init pinning backends", async () => {
    const connectionStrings = [
      "ipfs://localhost:5001",
      "ipfs+https://example.com",
      `powergate://localhost:5002?token=${token}`,
      `powergate+https://example.com?token=${token}`,
    ];
    const aggregation = await PinningAggregation.build(
      context,
      connectionStrings
    );
    expect(aggregation.backends.length).toEqual(4);

    expect(aggregation.backends[0]).toBeInstanceOf(IpfsPinning);
    const zero = aggregation.backends[0] as IpfsPinning;
    expect(zero.ipfsAddress).toEqual("http://localhost:5001");

    expect(aggregation.backends[1]).toBeInstanceOf(IpfsPinning);
    const one = aggregation.backends[1] as IpfsPinning;
    expect(one.ipfsAddress).toEqual("https://example.com:5001");

    expect(aggregation.backends[2]).toBeInstanceOf(PowergatePinning);
    const two = aggregation.backends[2] as PowergatePinning;
    expect(two.endpoint).toEqual("http://localhost:5002");
    expect(two.token).toEqual(token);

    expect(aggregation.backends[3]).toBeInstanceOf(PowergatePinning);
    const three = aggregation.backends[3] as PowergatePinning;
    expect(three.endpoint).toEqual("https://example.com:6002");
    expect(three.token).toEqual(token);
  });

  test("unknown designator", async () => {
    const connectionStrings = ["foo://localhost:5001"];
    await expect(
      PinningAggregation.build(context, connectionStrings)
    ).rejects.toThrow(UnknownPinningService);
  });

  test("mangled designator", async () => {
    const connectionStrings = ["foo+ipfs://example.com"];
    await expect(
      PinningAggregation.build(context, connectionStrings)
    ).rejects.toThrow(UnknownPinningService);
  });
});

describe("#open", () => {
  test("call all backends", async () => {
    const aggregation = await PinningAggregation.build(
      context,
      doubleFakeConnectionStrings,
      [FakePinning]
    );
    expect(aggregation.backends.length).toEqual(2);
    expect(aggregation.backends[0]).toBeInstanceOf(FakePinning);
    expect(aggregation.backends[1]).toBeInstanceOf(FakePinning);
    aggregation.backends[0].open = jest.fn();
    aggregation.backends[1].open = jest.fn();
    await aggregation.open();
    expect(aggregation.backends[0].open).toBeCalled();
    expect(aggregation.backends[1].open).toBeCalled();
  });

  test("throw if backend fails", async () => {
    const aggregation = await PinningAggregation.build(
      context,
      doubleFakeConnectionStrings,
      [FakePinning]
    );
    aggregation.backends[0].open = jest.fn(() => {
      throw new Error(`oops`);
    });
    aggregation.backends[1].open = jest.fn();
    await expect(aggregation.open()).rejects.toThrow("oops");
  });
});

describe("#close", () => {
  test("call all backends", async () => {
    const aggregation = await PinningAggregation.build(
      context,
      doubleFakeConnectionStrings,
      [FakePinning]
    );
    expect(aggregation.backends.length).toEqual(2);
    expect(aggregation.backends[0]).toBeInstanceOf(FakePinning);
    expect(aggregation.backends[1]).toBeInstanceOf(FakePinning);
    aggregation.backends[0].close = jest.fn();
    aggregation.backends[1].close = jest.fn();
    await aggregation.close();
    expect(aggregation.backends[0].close).toBeCalled();
    expect(aggregation.backends[1].close).toBeCalled();
  });

  test("throw if backend fails", async () => {
    const aggregation = await PinningAggregation.build(
      context,
      doubleFakeConnectionStrings,
      [FakePinning]
    );
    aggregation.backends[0].close = jest.fn(() => {
      throw new Error(`oops`);
    });
    aggregation.backends[1].close = jest.fn();
    await expect(aggregation.close()).rejects.toThrow("oops");
  });
});

describe("#pin", () => {
  test("call all backends", async () => {
    const aggregation = await PinningAggregation.build(
      context,
      doubleFakeConnectionStrings,
      [FakePinning]
    );
    expect(aggregation.backends.length).toEqual(2);
    expect(aggregation.backends[0]).toBeInstanceOf(FakePinning);
    expect(aggregation.backends[1]).toBeInstanceOf(FakePinning);
    aggregation.backends[0].pin = jest.fn();
    aggregation.backends[1].pin = jest.fn();
    await aggregation.pin(cid);
    expect(aggregation.backends[0].pin).toBeCalled();
    expect(aggregation.backends[1].pin).toBeCalled();
  });

  test("throw if backend fails", async () => {
    const aggregation = await PinningAggregation.build(
      context,
      doubleFakeConnectionStrings,
      [FakePinning]
    );
    aggregation.backends[0].pin = jest.fn(() => {
      throw new Error(`oops`);
    });
    aggregation.backends[1].pin = jest.fn();
    await expect(aggregation.pin(cid)).rejects.toThrow("oops");
  });
});

describe("#unpin", () => {
  test("call all backends", async () => {
    const aggregation = await PinningAggregation.build(
      context,
      doubleFakeConnectionStrings,
      [FakePinning]
    );
    expect(aggregation.backends.length).toEqual(2);
    expect(aggregation.backends[0]).toBeInstanceOf(FakePinning);
    expect(aggregation.backends[1]).toBeInstanceOf(FakePinning);
    aggregation.backends[0].unpin = jest.fn();
    aggregation.backends[1].unpin = jest.fn();
    await aggregation.unpin(cid);
    expect(aggregation.backends[0].unpin).toBeCalled();
    expect(aggregation.backends[1].unpin).toBeCalled();
  });

  test("resolve if backend fails", async () => {
    const aggregation = await PinningAggregation.build(
      context,
      doubleFakeConnectionStrings,
      [FakePinning]
    );
    aggregation.backends[0].unpin = jest.fn(() => {
      throw new Error(`oops`);
    });
    aggregation.backends[1].unpin = jest.fn();
    await expect(aggregation.unpin(cid)).resolves.toBeUndefined();
  });
});
