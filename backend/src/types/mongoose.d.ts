import { Error as MongooseError, ConnectOptions } from 'mongoose';

declare module 'mongoose' {
  export interface Error {
    name: string;
    message: string;
    stack?: string;
    code?: number;
    statusCode?: number;
  }

  export class ValidationError extends Error {
    errors: { [key: string]: any };
  }

  export class CastError extends Error {
    path: string;
    value: any;
    kind: string;
  }

  namespace Error {
    export class ValidationError extends MongooseError {
      errors: { [key: string]: any };
    }

    export class CastError extends MongooseError {
      path: string;
      value: any;
      kind: string;
    }
  }

  function connect(uri: string, options?: ConnectOptions): Promise<typeof import('mongoose')>;
}

export interface DatabaseError extends Error {
  name: string;
  code?: number;
  statusCode?: number;
  stack?: string;
  message: string;
}

export interface ConnectionError extends DatabaseError {
  name: string;
  message: string;
  syscall?: string;
  hostname?: string;
}

declare global {
  namespace Express {
    interface Error {
      status?: number;
      code?: number;
      statusCode?: number;
      syscall?: string;
      hostname?: string;
    }
  }
}

export {};