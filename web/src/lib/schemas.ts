import { BebopView, BebopRuntimeError, BebopRecord, BebopJson, BebopTypeGuard, Guid, GuidMap } from "bebop";

export enum ClientMessageType {
  Ping = 1,
  CursorLocation = 2,
  FinishStroke = 3,
  Clear = 4,
  Vote = 15,
  AuthADM = 25,
  StageChangeADM = 26,
  StartADM = 27,
  EndADM = 28,
  GameModeADM = 29,
  TestADM = 30,
}

export interface IVote extends BebopRecord {
  choice: GamerChoice;
}

export class Vote implements IVote {
  public choice: GamerChoice;

  constructor(record: IVote) {
    this.choice = record.choice;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return Vote.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IVote): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    Vote.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link Vote}.
   */
  public static validateCompatibility(record: IVote): void {
    BebopTypeGuard.ensureEnum(record.choice, GamerChoice);
  }

  /**
   * Unsafely creates an instance of {@link Vote} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IVote {
      return new Vote(record);
  }

  /**
   * Creates a new {@link Vote} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IVote {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`Vote.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    Vote.validateCompatibility(parsed);
    return Vote.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return Vote.encode(this);
  }

  public static encode(record: IVote): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    Vote.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IVote, view: BebopView): number {
    const before = view.length;
    view.writeUint32(record.choice);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IVote {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return Vote.readFrom(view);
  }

  public static readFrom(view: BebopView): IVote {
    let field0: GamerChoice;
    field0 = view.readUint32() as GamerChoice;
    let message: IVote = {
      choice: field0,
    };
    return new Vote(message);
  }
}

export enum Stage {
  GamerSelect = 1,
  AudienceLobby = 2,
  Drawing = 3,
  Voting = 4,
  Judging = 5,
  Results = 6,
}

export enum ServerMessageType {
  Ping = 1,
  GameState = 2,
  ClientTypeDTO = 3,
  ClientJoined = 4,
  DrawUpdate = 5,
  FinishStroke = 6,
  VoteUpdate = 7,
  NoGameState = 8,
  Clear = 9,
  Restart = 28,
  ResultsSTG = 33,
}

export interface IDrawUpdate extends BebopRecord {
  currentPoint: ICoord;
  prevPoint: ICoord;
  gamer: GamerChoice;
}

export class DrawUpdate implements IDrawUpdate {
  public currentPoint: ICoord;
  public prevPoint: ICoord;
  public gamer: GamerChoice;

  constructor(record: IDrawUpdate) {
    this.currentPoint = record.currentPoint;
    this.prevPoint = record.prevPoint;
    this.gamer = record.gamer;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return DrawUpdate.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IDrawUpdate): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    DrawUpdate.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link DrawUpdate}.
   */
  public static validateCompatibility(record: IDrawUpdate): void {
    Coord.validateCompatibility(record.currentPoint);
    Coord.validateCompatibility(record.prevPoint);
    BebopTypeGuard.ensureEnum(record.gamer, GamerChoice);
  }

  /**
   * Unsafely creates an instance of {@link DrawUpdate} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IDrawUpdate {
      record.currentPoint = Coord.unsafeCast(record.currentPoint);
      record.prevPoint = Coord.unsafeCast(record.prevPoint);
      return new DrawUpdate(record);
  }

  /**
   * Creates a new {@link DrawUpdate} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IDrawUpdate {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`DrawUpdate.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    DrawUpdate.validateCompatibility(parsed);
    return DrawUpdate.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return DrawUpdate.encode(this);
  }

  public static encode(record: IDrawUpdate): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    DrawUpdate.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IDrawUpdate, view: BebopView): number {
    const before = view.length;
    Coord.encodeInto(record.currentPoint, view)
    Coord.encodeInto(record.prevPoint, view)
    view.writeUint32(record.gamer);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IDrawUpdate {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return DrawUpdate.readFrom(view);
  }

  public static readFrom(view: BebopView): IDrawUpdate {
    let field0: ICoord;
    field0 = Coord.readFrom(view);
    let field1: ICoord;
    field1 = Coord.readFrom(view);
    let field2: GamerChoice;
    field2 = view.readUint32() as GamerChoice;
    let message: IDrawUpdate = {
      currentPoint: field0,
      prevPoint: field1,
      gamer: field2,
    };
    return new DrawUpdate(message);
  }
}

export interface IGameState extends BebopRecord {
  id: Guid;
  stage: Stage;
  stageFinishTime: bigint;
  clients: Map<number, ClientType>;
  drawings: Array<IDrawing>;
  prompt: IPrompt;
}

export class GameState implements IGameState {
  public id: Guid;
  public stage: Stage;
  public stageFinishTime: bigint;
  public clients: Map<number, ClientType>;
  public drawings: Array<IDrawing>;
  public prompt: IPrompt;

  constructor(record: IGameState) {
    this.id = record.id;
    this.stage = record.stage;
    this.stageFinishTime = record.stageFinishTime;
    this.clients = record.clients;
    this.drawings = record.drawings;
    this.prompt = record.prompt;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return GameState.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IGameState): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    GameState.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link GameState}.
   */
  public static validateCompatibility(record: IGameState): void {
    BebopTypeGuard.ensureGuid(record.id)
    BebopTypeGuard.ensureEnum(record.stage, Stage);
    BebopTypeGuard.ensureUint64(record.stageFinishTime)
    BebopTypeGuard.ensureMap(record.clients, BebopTypeGuard.ensureUint32, (value) => BebopTypeGuard.ensureEnum(value, ClientType));
    BebopTypeGuard.ensureArray(record.drawings, Drawing.validateCompatibility);
    Prompt.validateCompatibility(record.prompt);
  }

  /**
   * Unsafely creates an instance of {@link GameState} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IGameState {
      record.prompt = Prompt.unsafeCast(record.prompt);
      return new GameState(record);
  }

  /**
   * Creates a new {@link GameState} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IGameState {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`GameState.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    GameState.validateCompatibility(parsed);
    return GameState.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return GameState.encode(this);
  }

  public static encode(record: IGameState): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    GameState.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IGameState, view: BebopView): number {
    const before = view.length;
    view.writeGuid(record.id);
    view.writeUint32(record.stage);
    view.writeUint64(record.stageFinishTime);
    view.writeUint32(record.clients.size);
    for (const [k0, v0] of record.clients) {
      view.writeUint32(k0);
      view.writeUint32(v0);
    }
    {
      const length0 = record.drawings.length;
      view.writeUint32(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        Drawing.encodeInto(record.drawings[i0], view)
      }
    }
    Prompt.encodeInto(record.prompt, view)
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IGameState {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return GameState.readFrom(view);
  }

  public static readFrom(view: BebopView): IGameState {
    let field0: Guid;
    field0 = view.readGuid();
    let field1: Stage;
    field1 = view.readUint32() as Stage;
    let field2: bigint;
    field2 = view.readUint64();
    let field3: Map<number, ClientType>;
    {
      let length0 = view.readUint32();
      field3 = new Map<number, ClientType>();
      for (let i0 = 0; i0 < length0; i0++) {
        let k0: number;
        let v0: ClientType;
        k0 = view.readUint32();
        v0 = view.readUint32() as ClientType;
        field3.set(k0, v0);
      }
    }
    let field4: Array<IDrawing>;
    {
      let length0 = view.readUint32();
      field4 = new Array<IDrawing>(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        let x0: IDrawing;
        x0 = Drawing.readFrom(view);
        field4[i0] = x0;
      }
    }
    let field5: IPrompt;
    field5 = Prompt.readFrom(view);
    let message: IGameState = {
      id: field0,
      stage: field1,
      stageFinishTime: field2,
      clients: field3,
      drawings: field4,
      prompt: field5,
    };
    return new GameState(message);
  }
}

export interface IClientJoined extends BebopRecord {
  newClient: ClientType;
}

export class ClientJoined implements IClientJoined {
  public newClient: ClientType;

  constructor(record: IClientJoined) {
    this.newClient = record.newClient;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return ClientJoined.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IClientJoined): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    ClientJoined.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link ClientJoined}.
   */
  public static validateCompatibility(record: IClientJoined): void {
    BebopTypeGuard.ensureEnum(record.newClient, ClientType);
  }

  /**
   * Unsafely creates an instance of {@link ClientJoined} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IClientJoined {
      return new ClientJoined(record);
  }

  /**
   * Creates a new {@link ClientJoined} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IClientJoined {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`ClientJoined.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    ClientJoined.validateCompatibility(parsed);
    return ClientJoined.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return ClientJoined.encode(this);
  }

  public static encode(record: IClientJoined): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    ClientJoined.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IClientJoined, view: BebopView): number {
    const before = view.length;
    view.writeUint32(record.newClient);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IClientJoined {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return ClientJoined.readFrom(view);
  }

  public static readFrom(view: BebopView): IClientJoined {
    let field0: ClientType;
    field0 = view.readUint32() as ClientType;
    let message: IClientJoined = {
      newClient: field0,
    };
    return new ClientJoined(message);
  }
}

export interface INewSTG extends BebopRecord {
  id: Guid;
}

export class NewSTG implements INewSTG {
  public id: Guid;

  constructor(record: INewSTG) {
    this.id = record.id;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return NewSTG.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: INewSTG): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    NewSTG.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link NewSTG}.
   */
  public static validateCompatibility(record: INewSTG): void {
    BebopTypeGuard.ensureGuid(record.id)
  }

  /**
   * Unsafely creates an instance of {@link NewSTG} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): INewSTG {
      return new NewSTG(record);
  }

  /**
   * Creates a new {@link NewSTG} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): INewSTG {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`NewSTG.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    NewSTG.validateCompatibility(parsed);
    return NewSTG.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return NewSTG.encode(this);
  }

  public static encode(record: INewSTG): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    NewSTG.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: INewSTG, view: BebopView): number {
    const before = view.length;
    view.writeGuid(record.id);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): INewSTG {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return NewSTG.readFrom(view);
  }

  public static readFrom(view: BebopView): INewSTG {
    let field0: Guid;
    field0 = view.readGuid();
    let message: INewSTG = {
      id: field0,
    };
    return new NewSTG(message);
  }
}

export interface IResultsSTG extends BebopRecord {
  id: Guid;
  votes: Array<GamerChoice>;
  gamerAKVals: Array<number>;
  gamerBKVals: Array<number>;
}

export class ResultsSTG implements IResultsSTG {
  public id: Guid;
  public votes: Array<GamerChoice>;
  public gamerAKVals: Array<number>;
  public gamerBKVals: Array<number>;

  constructor(record: IResultsSTG) {
    this.id = record.id;
    this.votes = record.votes;
    this.gamerAKVals = record.gamerAKVals;
    this.gamerBKVals = record.gamerBKVals;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return ResultsSTG.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IResultsSTG): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    ResultsSTG.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link ResultsSTG}.
   */
  public static validateCompatibility(record: IResultsSTG): void {
    BebopTypeGuard.ensureGuid(record.id)
    BebopTypeGuard.ensureArray(record.votes, (value) => BebopTypeGuard.ensureEnum(value, GamerChoice));
    BebopTypeGuard.ensureArray(record.gamerAKVals, BebopTypeGuard.ensureUint32);
    BebopTypeGuard.ensureArray(record.gamerBKVals, BebopTypeGuard.ensureUint32);
  }

  /**
   * Unsafely creates an instance of {@link ResultsSTG} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IResultsSTG {
      return new ResultsSTG(record);
  }

  /**
   * Creates a new {@link ResultsSTG} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IResultsSTG {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`ResultsSTG.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    ResultsSTG.validateCompatibility(parsed);
    return ResultsSTG.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return ResultsSTG.encode(this);
  }

  public static encode(record: IResultsSTG): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    ResultsSTG.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IResultsSTG, view: BebopView): number {
    const before = view.length;
    view.writeGuid(record.id);
    {
      const length0 = record.votes.length;
      view.writeUint32(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        view.writeUint32(record.votes[i0]);
      }
    }
    {
      const length0 = record.gamerAKVals.length;
      view.writeUint32(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        view.writeUint32(record.gamerAKVals[i0]);
      }
    }
    {
      const length0 = record.gamerBKVals.length;
      view.writeUint32(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        view.writeUint32(record.gamerBKVals[i0]);
      }
    }
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IResultsSTG {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return ResultsSTG.readFrom(view);
  }

  public static readFrom(view: BebopView): IResultsSTG {
    let field0: Guid;
    field0 = view.readGuid();
    let field1: Array<GamerChoice>;
    {
      let length0 = view.readUint32();
      field1 = new Array<GamerChoice>(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        let x0: GamerChoice;
        x0 = view.readUint32() as GamerChoice;
        field1[i0] = x0;
      }
    }
    let field2: Array<number>;
    {
      let length0 = view.readUint32();
      field2 = new Array<number>(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        let x0: number;
        x0 = view.readUint32();
        field2[i0] = x0;
      }
    }
    let field3: Array<number>;
    {
      let length0 = view.readUint32();
      field3 = new Array<number>(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        let x0: number;
        x0 = view.readUint32();
        field3[i0] = x0;
      }
    }
    let message: IResultsSTG = {
      id: field0,
      votes: field1,
      gamerAKVals: field2,
      gamerBKVals: field3,
    };
    return new ResultsSTG(message);
  }
}

export interface IPrompt extends BebopRecord {
  name: string;
  class: number;
}

export class Prompt implements IPrompt {
  public name: string;
  public class: number;

  constructor(record: IPrompt) {
    this.name = record.name;
    this.class = record.class;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return Prompt.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IPrompt): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    Prompt.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link Prompt}.
   */
  public static validateCompatibility(record: IPrompt): void {
    BebopTypeGuard.ensureString(record.name)
    BebopTypeGuard.ensureUint32(record.class)
  }

  /**
   * Unsafely creates an instance of {@link Prompt} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IPrompt {
      return new Prompt(record);
  }

  /**
   * Creates a new {@link Prompt} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IPrompt {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`Prompt.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    Prompt.validateCompatibility(parsed);
    return Prompt.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return Prompt.encode(this);
  }

  public static encode(record: IPrompt): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    Prompt.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IPrompt, view: BebopView): number {
    const before = view.length;
    view.writeString(record.name);
    view.writeUint32(record.class);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IPrompt {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return Prompt.readFrom(view);
  }

  public static readFrom(view: BebopView): IPrompt {
    let field0: string;
    field0 = view.readString();
    let field1: number;
    field1 = view.readUint32();
    let message: IPrompt = {
      name: field0,
      class: field1,
    };
    return new Prompt(message);
  }
}

export interface IDrawing extends BebopRecord {
  strokes: Array<Array<ICoord>>;
}

export class Drawing implements IDrawing {
  public strokes: Array<Array<ICoord>>;

  constructor(record: IDrawing) {
    this.strokes = record.strokes;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return Drawing.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IDrawing): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    Drawing.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link Drawing}.
   */
  public static validateCompatibility(record: IDrawing): void {
    BebopTypeGuard.ensureArray(record.strokes, (element) => BebopTypeGuard.ensureArray(element, Coord.validateCompatibility));
  }

  /**
   * Unsafely creates an instance of {@link Drawing} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IDrawing {
      return new Drawing(record);
  }

  /**
   * Creates a new {@link Drawing} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IDrawing {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`Drawing.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    Drawing.validateCompatibility(parsed);
    return Drawing.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return Drawing.encode(this);
  }

  public static encode(record: IDrawing): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    Drawing.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IDrawing, view: BebopView): number {
    const before = view.length;
    {
      const length0 = record.strokes.length;
      view.writeUint32(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        {
          const length1 = record.strokes[i0].length;
          view.writeUint32(length1);
          for (let i1 = 0; i1 < length1; i1++) {
            Coord.encodeInto(record.strokes[i0][i1], view)
          }
        }
      }
    }
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IDrawing {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return Drawing.readFrom(view);
  }

  public static readFrom(view: BebopView): IDrawing {
    let field0: Array<Array<ICoord>>;
    {
      let length0 = view.readUint32();
      field0 = new Array<Array<ICoord>>(length0);
      for (let i0 = 0; i0 < length0; i0++) {
        let x0: Array<ICoord>;
        {
          let length1 = view.readUint32();
          x0 = new Array<ICoord>(length1);
          for (let i1 = 0; i1 < length1; i1++) {
            let x1: ICoord;
            x1 = Coord.readFrom(view);
            x0[i1] = x1;
          }
        }
        field0[i0] = x0;
      }
    }
    let message: IDrawing = {
      strokes: field0,
    };
    return new Drawing(message);
  }
}

export interface IClear extends BebopRecord {
  gamer: GamerChoice;
}

export class Clear implements IClear {
  public gamer: GamerChoice;

  constructor(record: IClear) {
    this.gamer = record.gamer;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return Clear.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IClear): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    Clear.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link Clear}.
   */
  public static validateCompatibility(record: IClear): void {
    BebopTypeGuard.ensureEnum(record.gamer, GamerChoice);
  }

  /**
   * Unsafely creates an instance of {@link Clear} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IClear {
      return new Clear(record);
  }

  /**
   * Creates a new {@link Clear} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IClear {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`Clear.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    Clear.validateCompatibility(parsed);
    return Clear.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return Clear.encode(this);
  }

  public static encode(record: IClear): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    Clear.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IClear, view: BebopView): number {
    const before = view.length;
    view.writeUint32(record.gamer);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IClear {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return Clear.readFrom(view);
  }

  public static readFrom(view: BebopView): IClear {
    let field0: GamerChoice;
    field0 = view.readUint32() as GamerChoice;
    let message: IClear = {
      gamer: field0,
    };
    return new Clear(message);
  }
}

export interface ISTgResults extends BebopRecord {
  id: Guid;
}

export class STgResults implements ISTgResults {
  public id: Guid;

  constructor(record: ISTgResults) {
    this.id = record.id;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return STgResults.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: ISTgResults): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    STgResults.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link STgResults}.
   */
  public static validateCompatibility(record: ISTgResults): void {
    BebopTypeGuard.ensureGuid(record.id)
  }

  /**
   * Unsafely creates an instance of {@link STgResults} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): ISTgResults {
      return new STgResults(record);
  }

  /**
   * Creates a new {@link STgResults} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): ISTgResults {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`STgResults.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    STgResults.validateCompatibility(parsed);
    return STgResults.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return STgResults.encode(this);
  }

  public static encode(record: ISTgResults): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    STgResults.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: ISTgResults, view: BebopView): number {
    const before = view.length;
    view.writeGuid(record.id);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): ISTgResults {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return STgResults.readFrom(view);
  }

  public static readFrom(view: BebopView): ISTgResults {
    let field0: Guid;
    field0 = view.readGuid();
    let message: ISTgResults = {
      id: field0,
    };
    return new STgResults(message);
  }
}

export interface IPing extends BebopRecord {
  msg: string;
  test: boolean;
}

export class Ping implements IPing {
  public msg: string;
  public test: boolean;

  constructor(record: IPing) {
    this.msg = record.msg;
    this.test = record.test;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return Ping.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IPing): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    Ping.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link Ping}.
   */
  public static validateCompatibility(record: IPing): void {
    BebopTypeGuard.ensureString(record.msg)
    BebopTypeGuard.ensureBoolean(record.test)
  }

  /**
   * Unsafely creates an instance of {@link Ping} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IPing {
      return new Ping(record);
  }

  /**
   * Creates a new {@link Ping} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IPing {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`Ping.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    Ping.validateCompatibility(parsed);
    return Ping.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return Ping.encode(this);
  }

  public static encode(record: IPing): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    Ping.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IPing, view: BebopView): number {
    const before = view.length;
    view.writeString(record.msg);
    view.writeByte(Number(record.test));
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IPing {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return Ping.readFrom(view);
  }

  public static readFrom(view: BebopView): IPing {
    let field0: string;
    field0 = view.readString();
    let field1: boolean;
    field1 = !!view.readByte();
    let message: IPing = {
      msg: field0,
      test: field1,
    };
    return new Ping(message);
  }
}

export interface IClientTypeDTO extends BebopRecord {
  gamerId: number;
  id: number;
  ctype: ClientType;
}

export class ClientTypeDTO implements IClientTypeDTO {
  public gamerId: number;
  public id: number;
  public ctype: ClientType;

  constructor(record: IClientTypeDTO) {
    this.gamerId = record.gamerId;
    this.id = record.id;
    this.ctype = record.ctype;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return ClientTypeDTO.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IClientTypeDTO): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    ClientTypeDTO.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link ClientTypeDTO}.
   */
  public static validateCompatibility(record: IClientTypeDTO): void {
    BebopTypeGuard.ensureUint8(record.gamerId)
    BebopTypeGuard.ensureUint32(record.id)
    BebopTypeGuard.ensureEnum(record.ctype, ClientType);
  }

  /**
   * Unsafely creates an instance of {@link ClientTypeDTO} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IClientTypeDTO {
      return new ClientTypeDTO(record);
  }

  /**
   * Creates a new {@link ClientTypeDTO} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IClientTypeDTO {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`ClientTypeDTO.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    ClientTypeDTO.validateCompatibility(parsed);
    return ClientTypeDTO.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return ClientTypeDTO.encode(this);
  }

  public static encode(record: IClientTypeDTO): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    ClientTypeDTO.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IClientTypeDTO, view: BebopView): number {
    const before = view.length;
    view.writeByte(record.gamerId);
    view.writeUint32(record.id);
    view.writeUint32(record.ctype);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IClientTypeDTO {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return ClientTypeDTO.readFrom(view);
  }

  public static readFrom(view: BebopView): IClientTypeDTO {
    let field0: number;
    field0 = view.readByte();
    let field1: number;
    field1 = view.readUint32();
    let field2: ClientType;
    field2 = view.readUint32() as ClientType;
    let message: IClientTypeDTO = {
      gamerId: field0,
      id: field1,
      ctype: field2,
    };
    return new ClientTypeDTO(message);
  }
}

export interface IFinishStroke extends BebopRecord {
  gamer: GamerChoice;
}

export class FinishStroke implements IFinishStroke {
  public gamer: GamerChoice;

  constructor(record: IFinishStroke) {
    this.gamer = record.gamer;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return FinishStroke.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IFinishStroke): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    FinishStroke.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link FinishStroke}.
   */
  public static validateCompatibility(record: IFinishStroke): void {
    BebopTypeGuard.ensureEnum(record.gamer, GamerChoice);
  }

  /**
   * Unsafely creates an instance of {@link FinishStroke} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IFinishStroke {
      return new FinishStroke(record);
  }

  /**
   * Creates a new {@link FinishStroke} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IFinishStroke {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`FinishStroke.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    FinishStroke.validateCompatibility(parsed);
    return FinishStroke.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return FinishStroke.encode(this);
  }

  public static encode(record: IFinishStroke): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    FinishStroke.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IFinishStroke, view: BebopView): number {
    const before = view.length;
    view.writeUint32(record.gamer);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IFinishStroke {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return FinishStroke.readFrom(view);
  }

  public static readFrom(view: BebopView): IFinishStroke {
    let field0: GamerChoice;
    field0 = view.readUint32() as GamerChoice;
    let message: IFinishStroke = {
      gamer: field0,
    };
    return new FinishStroke(message);
  }
}

export const AUDIENCE_LOBBY_TIME: number = 10000;

export const DRAWING_TIME: number = 20000;

export const VOTING_TIME: number = 5000;

export interface ICoord extends BebopRecord {
  x: number;
  y: number;
}

export class Coord implements ICoord {
  public x: number;
  public y: number;

  constructor(record: ICoord) {
    this.x = record.x;
    this.y = record.y;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return Coord.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: ICoord): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    Coord.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link Coord}.
   */
  public static validateCompatibility(record: ICoord): void {
    BebopTypeGuard.ensureFloat(record.x)
    BebopTypeGuard.ensureFloat(record.y)
  }

  /**
   * Unsafely creates an instance of {@link Coord} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): ICoord {
      return new Coord(record);
  }

  /**
   * Creates a new {@link Coord} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): ICoord {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`Coord.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    Coord.validateCompatibility(parsed);
    return Coord.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return Coord.encode(this);
  }

  public static encode(record: ICoord): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    Coord.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: ICoord, view: BebopView): number {
    const before = view.length;
    view.writeFloat32(record.x);
    view.writeFloat32(record.y);
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): ICoord {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return Coord.readFrom(view);
  }

  public static readFrom(view: BebopView): ICoord {
    let field0: number;
    field0 = view.readFloat32();
    let field1: number;
    field1 = view.readFloat32();
    let message: ICoord = {
      x: field0,
      y: field1,
    };
    return new Coord(message);
  }
}

export interface ICursorLocation extends BebopRecord {
  currentPoint: ICoord;
}

export class CursorLocation implements ICursorLocation {
  public currentPoint: ICoord;

  constructor(record: ICursorLocation) {
    this.currentPoint = record.currentPoint;
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return CursorLocation.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: ICursorLocation): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    CursorLocation.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link CursorLocation}.
   */
  public static validateCompatibility(record: ICursorLocation): void {
    Coord.validateCompatibility(record.currentPoint);
  }

  /**
   * Unsafely creates an instance of {@link CursorLocation} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): ICursorLocation {
      record.currentPoint = Coord.unsafeCast(record.currentPoint);
      return new CursorLocation(record);
  }

  /**
   * Creates a new {@link CursorLocation} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): ICursorLocation {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`CursorLocation.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    CursorLocation.validateCompatibility(parsed);
    return CursorLocation.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return CursorLocation.encode(this);
  }

  public static encode(record: ICursorLocation): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    CursorLocation.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: ICursorLocation, view: BebopView): number {
    const before = view.length;
    Coord.encodeInto(record.currentPoint, view)
    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): ICursorLocation {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return CursorLocation.readFrom(view);
  }

  public static readFrom(view: BebopView): ICursorLocation {
    let field0: ICoord;
    field0 = Coord.readFrom(view);
    let message: ICursorLocation = {
      currentPoint: field0,
    };
    return new CursorLocation(message);
  }
}

export enum GamerChoice {
  GamerA = 1,
  GamerB = 2,
  Neither = 3,
}

export enum ClientType {
  Gamer = 1,
  Audience = 2,
  Admin = 3,
  Unknown = 4,
}

export interface IEmpty extends BebopRecord {
}

export class Empty implements IEmpty {

  constructor(record: IEmpty) {
  }

  /**
   * Serializes the current instance into a JSON-Over-Bebop string
   */
  public toJSON(): string {
    return Empty.encodeToJSON(this);
  }

  /**
   * Serializes the specified object into a JSON-Over-Bebop string
   */
  public static encodeToJSON(record: IEmpty): string {
    return JSON.stringify(record, BebopJson.replacer);
  }

  /**
   * Validates that the runtime types of members in the current instance are correct.
   */
  public validateTypes(): void {
    Empty.validateCompatibility(this);
  }

  /**
   * Validates that the specified dynamic object can become an instance of {@link Empty}.
   */
  public static validateCompatibility(record: IEmpty): void {

  }

  /**
   * Unsafely creates an instance of {@link Empty} from the specified dynamic object. No type checking is performed.
   */
  public static unsafeCast(record: any): IEmpty {
      return new Empty(record);
  }

  /**
   * Creates a new {@link Empty} instance from a JSON-Over-Bebop string. Type checking is performed.
   */
  public static fromJSON(json: string): IEmpty {
    if (typeof json !== 'string' || json.trim().length === 0) {
      throw new BebopRuntimeError(`Empty.fromJSON: expected string`);
    }
    const parsed = JSON.parse(json, BebopJson.reviver);
    Empty.validateCompatibility(parsed);
    return Empty.unsafeCast(parsed);
  }
  public encode(): Uint8Array {
    return Empty.encode(this);
  }

  public static encode(record: IEmpty): Uint8Array {
    const view = BebopView.getInstance();
    view.startWriting();
    Empty.encodeInto(record, view);
    return view.toArray();
  }

  public static encodeInto(record: IEmpty, view: BebopView): number {
    const before = view.length;

    const after = view.length;
    return after - before;
  }

  public static decode(buffer: Uint8Array): IEmpty {
    const view = BebopView.getInstance();
    view.startReading(buffer);
    return Empty.readFrom(view);
  }

  public static readFrom(view: BebopView): IEmpty {
    let message: IEmpty = {
    };
    return new Empty(message);
  }
}

