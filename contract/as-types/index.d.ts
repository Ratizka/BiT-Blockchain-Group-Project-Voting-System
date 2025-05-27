// AssemblyScript types definition file for TypeScript IDE
// This file helps VS Code understand AssemblyScript types

// Primitive numeric types
declare type i8 = number;
declare type i16 = number;
declare type i32 = number;
declare type i64 = bigint;
declare type isize = number;

declare type u8 = number;
declare type u16 = number;
declare type u32 = number;
declare type u64 = bigint;
declare type usize = number;
declare type f32 = number;
declare type f64 = number;

// Boolean type
declare type bool = boolean;

// Decorator
declare function nearBindgen(constructor: Function): void;

// AssemblyScript specific functions
declare function changetype<T>(value: any): T;
declare function assert(condition: boolean, message?: string): void;
declare function store<T>(offset: usize, value: T): void;
declare function load<T>(offset: usize): T;

// Common operations
declare namespace String {
  function UTF8Length(str: string): usize;
}

// NEAR specific types
declare namespace near {
  function log(message: string): void;
}

// Context object
declare namespace Context {
  const sender: string;
  const blockIndex: u64;
  const blockTimestamp: u64;
}

// Persistent collections
declare class PersistentMap<K, V> {
  constructor(prefix: string);
  contains(key: K): boolean;
  get(key: K): V | null;
  getSome(key: K): V;
  set(key: K, value: V): void;
  delete(key: K): void;
}

declare class PersistentVector<T> {
  constructor(prefix: string);
  get length(): i32;
  push(value: T): void;
  pop(): T;
  get(index: i32): T;
  set(index: i32, value: T): void;
}

// NEAR SDK logging
declare namespace logging {
  function log(message: string): void;
}
