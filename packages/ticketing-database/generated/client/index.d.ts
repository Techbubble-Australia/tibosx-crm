
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Organization
 * 
 */
export type Organization = $Result.DefaultSelection<Prisma.$OrganizationPayload>
/**
 * Model TicketingUser
 * 
 */
export type TicketingUser = $Result.DefaultSelection<Prisma.$TicketingUserPayload>
/**
 * Model ConsultantOrganization
 * 
 */
export type ConsultantOrganization = $Result.DefaultSelection<Prisma.$ConsultantOrganizationPayload>
/**
 * Model Ticket
 * 
 */
export type Ticket = $Result.DefaultSelection<Prisma.$TicketPayload>
/**
 * Model TicketMessage
 * 
 */
export type TicketMessage = $Result.DefaultSelection<Prisma.$TicketMessagePayload>
/**
 * Model TicketAttachment
 * 
 */
export type TicketAttachment = $Result.DefaultSelection<Prisma.$TicketAttachmentPayload>
/**
 * Model TicketAuditLog
 * 
 */
export type TicketAuditLog = $Result.DefaultSelection<Prisma.$TicketAuditLogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const TicketingUserRole: {
  CLIENT: 'CLIENT',
  CONSULTANT: 'CONSULTANT'
};

export type TicketingUserRole = (typeof TicketingUserRole)[keyof typeof TicketingUserRole]


export const TicketType: {
  TECHNICAL: 'TECHNICAL',
  FINANCIAL_LOAN: 'FINANCIAL_LOAN',
  SERVICE_INTERNAL: 'SERVICE_INTERNAL',
  SERVICE_EXTERNAL: 'SERVICE_EXTERNAL'
};

export type TicketType = (typeof TicketType)[keyof typeof TicketType]


export const TicketPriority: {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority]


export const TicketStatus: {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_CLIENT: 'PENDING_CLIENT',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]

}

export type TicketingUserRole = $Enums.TicketingUserRole

export const TicketingUserRole: typeof $Enums.TicketingUserRole

export type TicketType = $Enums.TicketType

export const TicketType: typeof $Enums.TicketType

export type TicketPriority = $Enums.TicketPriority

export const TicketPriority: typeof $Enums.TicketPriority

export type TicketStatus = $Enums.TicketStatus

export const TicketStatus: typeof $Enums.TicketStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Organizations
 * const organizations = await prisma.organization.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Organizations
   * const organizations = await prisma.organization.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.organization`: Exposes CRUD operations for the **Organization** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Organizations
    * const organizations = await prisma.organization.findMany()
    * ```
    */
  get organization(): Prisma.OrganizationDelegate<ExtArgs>;

  /**
   * `prisma.ticketingUser`: Exposes CRUD operations for the **TicketingUser** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TicketingUsers
    * const ticketingUsers = await prisma.ticketingUser.findMany()
    * ```
    */
  get ticketingUser(): Prisma.TicketingUserDelegate<ExtArgs>;

  /**
   * `prisma.consultantOrganization`: Exposes CRUD operations for the **ConsultantOrganization** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConsultantOrganizations
    * const consultantOrganizations = await prisma.consultantOrganization.findMany()
    * ```
    */
  get consultantOrganization(): Prisma.ConsultantOrganizationDelegate<ExtArgs>;

  /**
   * `prisma.ticket`: Exposes CRUD operations for the **Ticket** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tickets
    * const tickets = await prisma.ticket.findMany()
    * ```
    */
  get ticket(): Prisma.TicketDelegate<ExtArgs>;

  /**
   * `prisma.ticketMessage`: Exposes CRUD operations for the **TicketMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TicketMessages
    * const ticketMessages = await prisma.ticketMessage.findMany()
    * ```
    */
  get ticketMessage(): Prisma.TicketMessageDelegate<ExtArgs>;

  /**
   * `prisma.ticketAttachment`: Exposes CRUD operations for the **TicketAttachment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TicketAttachments
    * const ticketAttachments = await prisma.ticketAttachment.findMany()
    * ```
    */
  get ticketAttachment(): Prisma.TicketAttachmentDelegate<ExtArgs>;

  /**
   * `prisma.ticketAuditLog`: Exposes CRUD operations for the **TicketAuditLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TicketAuditLogs
    * const ticketAuditLogs = await prisma.ticketAuditLog.findMany()
    * ```
    */
  get ticketAuditLog(): Prisma.TicketAuditLogDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Organization: 'Organization',
    TicketingUser: 'TicketingUser',
    ConsultantOrganization: 'ConsultantOrganization',
    Ticket: 'Ticket',
    TicketMessage: 'TicketMessage',
    TicketAttachment: 'TicketAttachment',
    TicketAuditLog: 'TicketAuditLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "organization" | "ticketingUser" | "consultantOrganization" | "ticket" | "ticketMessage" | "ticketAttachment" | "ticketAuditLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Organization: {
        payload: Prisma.$OrganizationPayload<ExtArgs>
        fields: Prisma.OrganizationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrganizationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrganizationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          findFirst: {
            args: Prisma.OrganizationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrganizationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          findMany: {
            args: Prisma.OrganizationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>[]
          }
          create: {
            args: Prisma.OrganizationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          createMany: {
            args: Prisma.OrganizationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OrganizationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>[]
          }
          delete: {
            args: Prisma.OrganizationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          update: {
            args: Prisma.OrganizationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          deleteMany: {
            args: Prisma.OrganizationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrganizationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.OrganizationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
          }
          aggregate: {
            args: Prisma.OrganizationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrganization>
          }
          groupBy: {
            args: Prisma.OrganizationGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrganizationGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrganizationCountArgs<ExtArgs>
            result: $Utils.Optional<OrganizationCountAggregateOutputType> | number
          }
        }
      }
      TicketingUser: {
        payload: Prisma.$TicketingUserPayload<ExtArgs>
        fields: Prisma.TicketingUserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TicketingUserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TicketingUserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload>
          }
          findFirst: {
            args: Prisma.TicketingUserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TicketingUserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload>
          }
          findMany: {
            args: Prisma.TicketingUserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload>[]
          }
          create: {
            args: Prisma.TicketingUserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload>
          }
          createMany: {
            args: Prisma.TicketingUserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TicketingUserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload>[]
          }
          delete: {
            args: Prisma.TicketingUserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload>
          }
          update: {
            args: Prisma.TicketingUserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload>
          }
          deleteMany: {
            args: Prisma.TicketingUserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TicketingUserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TicketingUserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketingUserPayload>
          }
          aggregate: {
            args: Prisma.TicketingUserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTicketingUser>
          }
          groupBy: {
            args: Prisma.TicketingUserGroupByArgs<ExtArgs>
            result: $Utils.Optional<TicketingUserGroupByOutputType>[]
          }
          count: {
            args: Prisma.TicketingUserCountArgs<ExtArgs>
            result: $Utils.Optional<TicketingUserCountAggregateOutputType> | number
          }
        }
      }
      ConsultantOrganization: {
        payload: Prisma.$ConsultantOrganizationPayload<ExtArgs>
        fields: Prisma.ConsultantOrganizationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConsultantOrganizationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConsultantOrganizationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload>
          }
          findFirst: {
            args: Prisma.ConsultantOrganizationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConsultantOrganizationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload>
          }
          findMany: {
            args: Prisma.ConsultantOrganizationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload>[]
          }
          create: {
            args: Prisma.ConsultantOrganizationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload>
          }
          createMany: {
            args: Prisma.ConsultantOrganizationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConsultantOrganizationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload>[]
          }
          delete: {
            args: Prisma.ConsultantOrganizationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload>
          }
          update: {
            args: Prisma.ConsultantOrganizationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload>
          }
          deleteMany: {
            args: Prisma.ConsultantOrganizationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConsultantOrganizationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ConsultantOrganizationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsultantOrganizationPayload>
          }
          aggregate: {
            args: Prisma.ConsultantOrganizationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConsultantOrganization>
          }
          groupBy: {
            args: Prisma.ConsultantOrganizationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConsultantOrganizationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConsultantOrganizationCountArgs<ExtArgs>
            result: $Utils.Optional<ConsultantOrganizationCountAggregateOutputType> | number
          }
        }
      }
      Ticket: {
        payload: Prisma.$TicketPayload<ExtArgs>
        fields: Prisma.TicketFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TicketFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TicketFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          findFirst: {
            args: Prisma.TicketFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TicketFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          findMany: {
            args: Prisma.TicketFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>[]
          }
          create: {
            args: Prisma.TicketCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          createMany: {
            args: Prisma.TicketCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TicketCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>[]
          }
          delete: {
            args: Prisma.TicketDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          update: {
            args: Prisma.TicketUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          deleteMany: {
            args: Prisma.TicketDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TicketUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TicketUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          aggregate: {
            args: Prisma.TicketAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTicket>
          }
          groupBy: {
            args: Prisma.TicketGroupByArgs<ExtArgs>
            result: $Utils.Optional<TicketGroupByOutputType>[]
          }
          count: {
            args: Prisma.TicketCountArgs<ExtArgs>
            result: $Utils.Optional<TicketCountAggregateOutputType> | number
          }
        }
      }
      TicketMessage: {
        payload: Prisma.$TicketMessagePayload<ExtArgs>
        fields: Prisma.TicketMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TicketMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TicketMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload>
          }
          findFirst: {
            args: Prisma.TicketMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TicketMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload>
          }
          findMany: {
            args: Prisma.TicketMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload>[]
          }
          create: {
            args: Prisma.TicketMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload>
          }
          createMany: {
            args: Prisma.TicketMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TicketMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload>[]
          }
          delete: {
            args: Prisma.TicketMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload>
          }
          update: {
            args: Prisma.TicketMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload>
          }
          deleteMany: {
            args: Prisma.TicketMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TicketMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TicketMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketMessagePayload>
          }
          aggregate: {
            args: Prisma.TicketMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTicketMessage>
          }
          groupBy: {
            args: Prisma.TicketMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<TicketMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.TicketMessageCountArgs<ExtArgs>
            result: $Utils.Optional<TicketMessageCountAggregateOutputType> | number
          }
        }
      }
      TicketAttachment: {
        payload: Prisma.$TicketAttachmentPayload<ExtArgs>
        fields: Prisma.TicketAttachmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TicketAttachmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TicketAttachmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload>
          }
          findFirst: {
            args: Prisma.TicketAttachmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TicketAttachmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload>
          }
          findMany: {
            args: Prisma.TicketAttachmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload>[]
          }
          create: {
            args: Prisma.TicketAttachmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload>
          }
          createMany: {
            args: Prisma.TicketAttachmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TicketAttachmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload>[]
          }
          delete: {
            args: Prisma.TicketAttachmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload>
          }
          update: {
            args: Prisma.TicketAttachmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload>
          }
          deleteMany: {
            args: Prisma.TicketAttachmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TicketAttachmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TicketAttachmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAttachmentPayload>
          }
          aggregate: {
            args: Prisma.TicketAttachmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTicketAttachment>
          }
          groupBy: {
            args: Prisma.TicketAttachmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<TicketAttachmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.TicketAttachmentCountArgs<ExtArgs>
            result: $Utils.Optional<TicketAttachmentCountAggregateOutputType> | number
          }
        }
      }
      TicketAuditLog: {
        payload: Prisma.$TicketAuditLogPayload<ExtArgs>
        fields: Prisma.TicketAuditLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TicketAuditLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TicketAuditLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload>
          }
          findFirst: {
            args: Prisma.TicketAuditLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TicketAuditLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload>
          }
          findMany: {
            args: Prisma.TicketAuditLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload>[]
          }
          create: {
            args: Prisma.TicketAuditLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload>
          }
          createMany: {
            args: Prisma.TicketAuditLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TicketAuditLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload>[]
          }
          delete: {
            args: Prisma.TicketAuditLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload>
          }
          update: {
            args: Prisma.TicketAuditLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload>
          }
          deleteMany: {
            args: Prisma.TicketAuditLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TicketAuditLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TicketAuditLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketAuditLogPayload>
          }
          aggregate: {
            args: Prisma.TicketAuditLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTicketAuditLog>
          }
          groupBy: {
            args: Prisma.TicketAuditLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<TicketAuditLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.TicketAuditLogCountArgs<ExtArgs>
            result: $Utils.Optional<TicketAuditLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type OrganizationCountOutputType
   */

  export type OrganizationCountOutputType = {
    users: number
    tickets: number
    consultantOrganizations: number
  }

  export type OrganizationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | OrganizationCountOutputTypeCountUsersArgs
    tickets?: boolean | OrganizationCountOutputTypeCountTicketsArgs
    consultantOrganizations?: boolean | OrganizationCountOutputTypeCountConsultantOrganizationsArgs
  }

  // Custom InputTypes
  /**
   * OrganizationCountOutputType without action
   */
  export type OrganizationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrganizationCountOutputType
     */
    select?: OrganizationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * OrganizationCountOutputType without action
   */
  export type OrganizationCountOutputTypeCountUsersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketingUserWhereInput
  }

  /**
   * OrganizationCountOutputType without action
   */
  export type OrganizationCountOutputTypeCountTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
  }

  /**
   * OrganizationCountOutputType without action
   */
  export type OrganizationCountOutputTypeCountConsultantOrganizationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConsultantOrganizationWhereInput
  }


  /**
   * Count Type TicketingUserCountOutputType
   */

  export type TicketingUserCountOutputType = {
    createdTickets: number
    assignedTickets: number
    messages: number
    auditLogs: number
    consultantOrganizations: number
  }

  export type TicketingUserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdTickets?: boolean | TicketingUserCountOutputTypeCountCreatedTicketsArgs
    assignedTickets?: boolean | TicketingUserCountOutputTypeCountAssignedTicketsArgs
    messages?: boolean | TicketingUserCountOutputTypeCountMessagesArgs
    auditLogs?: boolean | TicketingUserCountOutputTypeCountAuditLogsArgs
    consultantOrganizations?: boolean | TicketingUserCountOutputTypeCountConsultantOrganizationsArgs
  }

  // Custom InputTypes
  /**
   * TicketingUserCountOutputType without action
   */
  export type TicketingUserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUserCountOutputType
     */
    select?: TicketingUserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TicketingUserCountOutputType without action
   */
  export type TicketingUserCountOutputTypeCountCreatedTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
  }

  /**
   * TicketingUserCountOutputType without action
   */
  export type TicketingUserCountOutputTypeCountAssignedTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
  }

  /**
   * TicketingUserCountOutputType without action
   */
  export type TicketingUserCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketMessageWhereInput
  }

  /**
   * TicketingUserCountOutputType without action
   */
  export type TicketingUserCountOutputTypeCountAuditLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketAuditLogWhereInput
  }

  /**
   * TicketingUserCountOutputType without action
   */
  export type TicketingUserCountOutputTypeCountConsultantOrganizationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConsultantOrganizationWhereInput
  }


  /**
   * Count Type TicketCountOutputType
   */

  export type TicketCountOutputType = {
    messages: number
    attachments: number
    auditLogs: number
  }

  export type TicketCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | TicketCountOutputTypeCountMessagesArgs
    attachments?: boolean | TicketCountOutputTypeCountAttachmentsArgs
    auditLogs?: boolean | TicketCountOutputTypeCountAuditLogsArgs
  }

  // Custom InputTypes
  /**
   * TicketCountOutputType without action
   */
  export type TicketCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketCountOutputType
     */
    select?: TicketCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TicketCountOutputType without action
   */
  export type TicketCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketMessageWhereInput
  }

  /**
   * TicketCountOutputType without action
   */
  export type TicketCountOutputTypeCountAttachmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketAttachmentWhereInput
  }

  /**
   * TicketCountOutputType without action
   */
  export type TicketCountOutputTypeCountAuditLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketAuditLogWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Organization
   */

  export type AggregateOrganization = {
    _count: OrganizationCountAggregateOutputType | null
    _min: OrganizationMinAggregateOutputType | null
    _max: OrganizationMaxAggregateOutputType | null
  }

  export type OrganizationMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OrganizationMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OrganizationCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    active: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type OrganizationMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    active?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OrganizationMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    active?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OrganizationCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    active?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type OrganizationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Organization to aggregate.
     */
    where?: OrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Organizations to fetch.
     */
    orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Organizations
    **/
    _count?: true | OrganizationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrganizationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrganizationMaxAggregateInputType
  }

  export type GetOrganizationAggregateType<T extends OrganizationAggregateArgs> = {
        [P in keyof T & keyof AggregateOrganization]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrganization[P]>
      : GetScalarType<T[P], AggregateOrganization[P]>
  }




  export type OrganizationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrganizationWhereInput
    orderBy?: OrganizationOrderByWithAggregationInput | OrganizationOrderByWithAggregationInput[]
    by: OrganizationScalarFieldEnum[] | OrganizationScalarFieldEnum
    having?: OrganizationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrganizationCountAggregateInputType | true
    _min?: OrganizationMinAggregateInputType
    _max?: OrganizationMaxAggregateInputType
  }

  export type OrganizationGroupByOutputType = {
    id: string
    name: string
    slug: string
    active: boolean
    createdAt: Date
    updatedAt: Date
    _count: OrganizationCountAggregateOutputType | null
    _min: OrganizationMinAggregateOutputType | null
    _max: OrganizationMaxAggregateOutputType | null
  }

  type GetOrganizationGroupByPayload<T extends OrganizationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrganizationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrganizationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrganizationGroupByOutputType[P]>
            : GetScalarType<T[P], OrganizationGroupByOutputType[P]>
        }
      >
    >


  export type OrganizationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    users?: boolean | Organization$usersArgs<ExtArgs>
    tickets?: boolean | Organization$ticketsArgs<ExtArgs>
    consultantOrganizations?: boolean | Organization$consultantOrganizationsArgs<ExtArgs>
    _count?: boolean | OrganizationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["organization"]>

  export type OrganizationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["organization"]>

  export type OrganizationSelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type OrganizationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | Organization$usersArgs<ExtArgs>
    tickets?: boolean | Organization$ticketsArgs<ExtArgs>
    consultantOrganizations?: boolean | Organization$consultantOrganizationsArgs<ExtArgs>
    _count?: boolean | OrganizationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type OrganizationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $OrganizationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Organization"
    objects: {
      users: Prisma.$TicketingUserPayload<ExtArgs>[]
      tickets: Prisma.$TicketPayload<ExtArgs>[]
      consultantOrganizations: Prisma.$ConsultantOrganizationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      active: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["organization"]>
    composites: {}
  }

  type OrganizationGetPayload<S extends boolean | null | undefined | OrganizationDefaultArgs> = $Result.GetResult<Prisma.$OrganizationPayload, S>

  type OrganizationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<OrganizationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: OrganizationCountAggregateInputType | true
    }

  export interface OrganizationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Organization'], meta: { name: 'Organization' } }
    /**
     * Find zero or one Organization that matches the filter.
     * @param {OrganizationFindUniqueArgs} args - Arguments to find a Organization
     * @example
     * // Get one Organization
     * const organization = await prisma.organization.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrganizationFindUniqueArgs>(args: SelectSubset<T, OrganizationFindUniqueArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Organization that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {OrganizationFindUniqueOrThrowArgs} args - Arguments to find a Organization
     * @example
     * // Get one Organization
     * const organization = await prisma.organization.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrganizationFindUniqueOrThrowArgs>(args: SelectSubset<T, OrganizationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Organization that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationFindFirstArgs} args - Arguments to find a Organization
     * @example
     * // Get one Organization
     * const organization = await prisma.organization.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrganizationFindFirstArgs>(args?: SelectSubset<T, OrganizationFindFirstArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Organization that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationFindFirstOrThrowArgs} args - Arguments to find a Organization
     * @example
     * // Get one Organization
     * const organization = await prisma.organization.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrganizationFindFirstOrThrowArgs>(args?: SelectSubset<T, OrganizationFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Organizations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Organizations
     * const organizations = await prisma.organization.findMany()
     * 
     * // Get first 10 Organizations
     * const organizations = await prisma.organization.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const organizationWithIdOnly = await prisma.organization.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrganizationFindManyArgs>(args?: SelectSubset<T, OrganizationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Organization.
     * @param {OrganizationCreateArgs} args - Arguments to create a Organization.
     * @example
     * // Create one Organization
     * const Organization = await prisma.organization.create({
     *   data: {
     *     // ... data to create a Organization
     *   }
     * })
     * 
     */
    create<T extends OrganizationCreateArgs>(args: SelectSubset<T, OrganizationCreateArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Organizations.
     * @param {OrganizationCreateManyArgs} args - Arguments to create many Organizations.
     * @example
     * // Create many Organizations
     * const organization = await prisma.organization.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrganizationCreateManyArgs>(args?: SelectSubset<T, OrganizationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Organizations and returns the data saved in the database.
     * @param {OrganizationCreateManyAndReturnArgs} args - Arguments to create many Organizations.
     * @example
     * // Create many Organizations
     * const organization = await prisma.organization.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Organizations and only return the `id`
     * const organizationWithIdOnly = await prisma.organization.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OrganizationCreateManyAndReturnArgs>(args?: SelectSubset<T, OrganizationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Organization.
     * @param {OrganizationDeleteArgs} args - Arguments to delete one Organization.
     * @example
     * // Delete one Organization
     * const Organization = await prisma.organization.delete({
     *   where: {
     *     // ... filter to delete one Organization
     *   }
     * })
     * 
     */
    delete<T extends OrganizationDeleteArgs>(args: SelectSubset<T, OrganizationDeleteArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Organization.
     * @param {OrganizationUpdateArgs} args - Arguments to update one Organization.
     * @example
     * // Update one Organization
     * const organization = await prisma.organization.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrganizationUpdateArgs>(args: SelectSubset<T, OrganizationUpdateArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Organizations.
     * @param {OrganizationDeleteManyArgs} args - Arguments to filter Organizations to delete.
     * @example
     * // Delete a few Organizations
     * const { count } = await prisma.organization.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrganizationDeleteManyArgs>(args?: SelectSubset<T, OrganizationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Organizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Organizations
     * const organization = await prisma.organization.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrganizationUpdateManyArgs>(args: SelectSubset<T, OrganizationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Organization.
     * @param {OrganizationUpsertArgs} args - Arguments to update or create a Organization.
     * @example
     * // Update or create a Organization
     * const organization = await prisma.organization.upsert({
     *   create: {
     *     // ... data to create a Organization
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Organization we want to update
     *   }
     * })
     */
    upsert<T extends OrganizationUpsertArgs>(args: SelectSubset<T, OrganizationUpsertArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Organizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationCountArgs} args - Arguments to filter Organizations to count.
     * @example
     * // Count the number of Organizations
     * const count = await prisma.organization.count({
     *   where: {
     *     // ... the filter for the Organizations we want to count
     *   }
     * })
    **/
    count<T extends OrganizationCountArgs>(
      args?: Subset<T, OrganizationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrganizationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Organization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrganizationAggregateArgs>(args: Subset<T, OrganizationAggregateArgs>): Prisma.PrismaPromise<GetOrganizationAggregateType<T>>

    /**
     * Group by Organization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrganizationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrganizationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrganizationGroupByArgs['orderBy'] }
        : { orderBy?: OrganizationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrganizationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrganizationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Organization model
   */
  readonly fields: OrganizationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Organization.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrganizationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    users<T extends Organization$usersArgs<ExtArgs> = {}>(args?: Subset<T, Organization$usersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findMany"> | Null>
    tickets<T extends Organization$ticketsArgs<ExtArgs> = {}>(args?: Subset<T, Organization$ticketsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany"> | Null>
    consultantOrganizations<T extends Organization$consultantOrganizationsArgs<ExtArgs> = {}>(args?: Subset<T, Organization$consultantOrganizationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Organization model
   */ 
  interface OrganizationFieldRefs {
    readonly id: FieldRef<"Organization", 'String'>
    readonly name: FieldRef<"Organization", 'String'>
    readonly slug: FieldRef<"Organization", 'String'>
    readonly active: FieldRef<"Organization", 'Boolean'>
    readonly createdAt: FieldRef<"Organization", 'DateTime'>
    readonly updatedAt: FieldRef<"Organization", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Organization findUnique
   */
  export type OrganizationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organization to fetch.
     */
    where: OrganizationWhereUniqueInput
  }

  /**
   * Organization findUniqueOrThrow
   */
  export type OrganizationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organization to fetch.
     */
    where: OrganizationWhereUniqueInput
  }

  /**
   * Organization findFirst
   */
  export type OrganizationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organization to fetch.
     */
    where?: OrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Organizations to fetch.
     */
    orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Organizations.
     */
    cursor?: OrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Organizations.
     */
    distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
  }

  /**
   * Organization findFirstOrThrow
   */
  export type OrganizationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organization to fetch.
     */
    where?: OrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Organizations to fetch.
     */
    orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Organizations.
     */
    cursor?: OrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Organizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Organizations.
     */
    distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
  }

  /**
   * Organization findMany
   */
  export type OrganizationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter, which Organizations to fetch.
     */
    where?: OrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Organizations to fetch.
     */
    orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Organizations.
     */
    cursor?: OrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Organizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Organizations.
     */
    skip?: number
    distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
  }

  /**
   * Organization create
   */
  export type OrganizationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * The data needed to create a Organization.
     */
    data: XOR<OrganizationCreateInput, OrganizationUncheckedCreateInput>
  }

  /**
   * Organization createMany
   */
  export type OrganizationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Organizations.
     */
    data: OrganizationCreateManyInput | OrganizationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Organization createManyAndReturn
   */
  export type OrganizationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Organizations.
     */
    data: OrganizationCreateManyInput | OrganizationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Organization update
   */
  export type OrganizationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * The data needed to update a Organization.
     */
    data: XOR<OrganizationUpdateInput, OrganizationUncheckedUpdateInput>
    /**
     * Choose, which Organization to update.
     */
    where: OrganizationWhereUniqueInput
  }

  /**
   * Organization updateMany
   */
  export type OrganizationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Organizations.
     */
    data: XOR<OrganizationUpdateManyMutationInput, OrganizationUncheckedUpdateManyInput>
    /**
     * Filter which Organizations to update
     */
    where?: OrganizationWhereInput
  }

  /**
   * Organization upsert
   */
  export type OrganizationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * The filter to search for the Organization to update in case it exists.
     */
    where: OrganizationWhereUniqueInput
    /**
     * In case the Organization found by the `where` argument doesn't exist, create a new Organization with this data.
     */
    create: XOR<OrganizationCreateInput, OrganizationUncheckedCreateInput>
    /**
     * In case the Organization was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrganizationUpdateInput, OrganizationUncheckedUpdateInput>
  }

  /**
   * Organization delete
   */
  export type OrganizationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    /**
     * Filter which Organization to delete.
     */
    where: OrganizationWhereUniqueInput
  }

  /**
   * Organization deleteMany
   */
  export type OrganizationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Organizations to delete
     */
    where?: OrganizationWhereInput
  }

  /**
   * Organization.users
   */
  export type Organization$usersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    where?: TicketingUserWhereInput
    orderBy?: TicketingUserOrderByWithRelationInput | TicketingUserOrderByWithRelationInput[]
    cursor?: TicketingUserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketingUserScalarFieldEnum | TicketingUserScalarFieldEnum[]
  }

  /**
   * Organization.tickets
   */
  export type Organization$ticketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    cursor?: TicketWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Organization.consultantOrganizations
   */
  export type Organization$consultantOrganizationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    where?: ConsultantOrganizationWhereInput
    orderBy?: ConsultantOrganizationOrderByWithRelationInput | ConsultantOrganizationOrderByWithRelationInput[]
    cursor?: ConsultantOrganizationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConsultantOrganizationScalarFieldEnum | ConsultantOrganizationScalarFieldEnum[]
  }

  /**
   * Organization without action
   */
  export type OrganizationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
  }


  /**
   * Model TicketingUser
   */

  export type AggregateTicketingUser = {
    _count: TicketingUserCountAggregateOutputType | null
    _min: TicketingUserMinAggregateOutputType | null
    _max: TicketingUserMaxAggregateOutputType | null
  }

  export type TicketingUserMinAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    name: string | null
    role: $Enums.TicketingUserRole | null
    organizationId: string | null
    consultantVerified: boolean | null
    tbosAdminUserId: string | null
    tbosRole: string | null
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TicketingUserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    name: string | null
    role: $Enums.TicketingUserRole | null
    organizationId: string | null
    consultantVerified: boolean | null
    tbosAdminUserId: string | null
    tbosRole: string | null
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TicketingUserCountAggregateOutputType = {
    id: number
    email: number
    passwordHash: number
    name: number
    role: number
    organizationId: number
    consultantVerified: number
    tbosAdminUserId: number
    tbosRole: number
    active: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TicketingUserMinAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    organizationId?: true
    consultantVerified?: true
    tbosAdminUserId?: true
    tbosRole?: true
    active?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TicketingUserMaxAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    organizationId?: true
    consultantVerified?: true
    tbosAdminUserId?: true
    tbosRole?: true
    active?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TicketingUserCountAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    organizationId?: true
    consultantVerified?: true
    tbosAdminUserId?: true
    tbosRole?: true
    active?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TicketingUserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TicketingUser to aggregate.
     */
    where?: TicketingUserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketingUsers to fetch.
     */
    orderBy?: TicketingUserOrderByWithRelationInput | TicketingUserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TicketingUserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketingUsers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketingUsers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TicketingUsers
    **/
    _count?: true | TicketingUserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TicketingUserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TicketingUserMaxAggregateInputType
  }

  export type GetTicketingUserAggregateType<T extends TicketingUserAggregateArgs> = {
        [P in keyof T & keyof AggregateTicketingUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTicketingUser[P]>
      : GetScalarType<T[P], AggregateTicketingUser[P]>
  }




  export type TicketingUserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketingUserWhereInput
    orderBy?: TicketingUserOrderByWithAggregationInput | TicketingUserOrderByWithAggregationInput[]
    by: TicketingUserScalarFieldEnum[] | TicketingUserScalarFieldEnum
    having?: TicketingUserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TicketingUserCountAggregateInputType | true
    _min?: TicketingUserMinAggregateInputType
    _max?: TicketingUserMaxAggregateInputType
  }

  export type TicketingUserGroupByOutputType = {
    id: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    organizationId: string | null
    consultantVerified: boolean
    tbosAdminUserId: string | null
    tbosRole: string | null
    active: boolean
    createdAt: Date
    updatedAt: Date
    _count: TicketingUserCountAggregateOutputType | null
    _min: TicketingUserMinAggregateOutputType | null
    _max: TicketingUserMaxAggregateOutputType | null
  }

  type GetTicketingUserGroupByPayload<T extends TicketingUserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TicketingUserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TicketingUserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TicketingUserGroupByOutputType[P]>
            : GetScalarType<T[P], TicketingUserGroupByOutputType[P]>
        }
      >
    >


  export type TicketingUserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    organizationId?: boolean
    consultantVerified?: boolean
    tbosAdminUserId?: boolean
    tbosRole?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    organization?: boolean | TicketingUser$organizationArgs<ExtArgs>
    createdTickets?: boolean | TicketingUser$createdTicketsArgs<ExtArgs>
    assignedTickets?: boolean | TicketingUser$assignedTicketsArgs<ExtArgs>
    messages?: boolean | TicketingUser$messagesArgs<ExtArgs>
    auditLogs?: boolean | TicketingUser$auditLogsArgs<ExtArgs>
    consultantOrganizations?: boolean | TicketingUser$consultantOrganizationsArgs<ExtArgs>
    _count?: boolean | TicketingUserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticketingUser"]>

  export type TicketingUserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    organizationId?: boolean
    consultantVerified?: boolean
    tbosAdminUserId?: boolean
    tbosRole?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    organization?: boolean | TicketingUser$organizationArgs<ExtArgs>
  }, ExtArgs["result"]["ticketingUser"]>

  export type TicketingUserSelectScalar = {
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    organizationId?: boolean
    consultantVerified?: boolean
    tbosAdminUserId?: boolean
    tbosRole?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TicketingUserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | TicketingUser$organizationArgs<ExtArgs>
    createdTickets?: boolean | TicketingUser$createdTicketsArgs<ExtArgs>
    assignedTickets?: boolean | TicketingUser$assignedTicketsArgs<ExtArgs>
    messages?: boolean | TicketingUser$messagesArgs<ExtArgs>
    auditLogs?: boolean | TicketingUser$auditLogsArgs<ExtArgs>
    consultantOrganizations?: boolean | TicketingUser$consultantOrganizationsArgs<ExtArgs>
    _count?: boolean | TicketingUserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TicketingUserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | TicketingUser$organizationArgs<ExtArgs>
  }

  export type $TicketingUserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TicketingUser"
    objects: {
      organization: Prisma.$OrganizationPayload<ExtArgs> | null
      createdTickets: Prisma.$TicketPayload<ExtArgs>[]
      assignedTickets: Prisma.$TicketPayload<ExtArgs>[]
      messages: Prisma.$TicketMessagePayload<ExtArgs>[]
      auditLogs: Prisma.$TicketAuditLogPayload<ExtArgs>[]
      consultantOrganizations: Prisma.$ConsultantOrganizationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      passwordHash: string
      name: string
      role: $Enums.TicketingUserRole
      organizationId: string | null
      consultantVerified: boolean
      tbosAdminUserId: string | null
      tbosRole: string | null
      active: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["ticketingUser"]>
    composites: {}
  }

  type TicketingUserGetPayload<S extends boolean | null | undefined | TicketingUserDefaultArgs> = $Result.GetResult<Prisma.$TicketingUserPayload, S>

  type TicketingUserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TicketingUserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TicketingUserCountAggregateInputType | true
    }

  export interface TicketingUserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TicketingUser'], meta: { name: 'TicketingUser' } }
    /**
     * Find zero or one TicketingUser that matches the filter.
     * @param {TicketingUserFindUniqueArgs} args - Arguments to find a TicketingUser
     * @example
     * // Get one TicketingUser
     * const ticketingUser = await prisma.ticketingUser.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TicketingUserFindUniqueArgs>(args: SelectSubset<T, TicketingUserFindUniqueArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TicketingUser that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TicketingUserFindUniqueOrThrowArgs} args - Arguments to find a TicketingUser
     * @example
     * // Get one TicketingUser
     * const ticketingUser = await prisma.ticketingUser.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TicketingUserFindUniqueOrThrowArgs>(args: SelectSubset<T, TicketingUserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TicketingUser that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketingUserFindFirstArgs} args - Arguments to find a TicketingUser
     * @example
     * // Get one TicketingUser
     * const ticketingUser = await prisma.ticketingUser.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TicketingUserFindFirstArgs>(args?: SelectSubset<T, TicketingUserFindFirstArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TicketingUser that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketingUserFindFirstOrThrowArgs} args - Arguments to find a TicketingUser
     * @example
     * // Get one TicketingUser
     * const ticketingUser = await prisma.ticketingUser.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TicketingUserFindFirstOrThrowArgs>(args?: SelectSubset<T, TicketingUserFindFirstOrThrowArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TicketingUsers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketingUserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TicketingUsers
     * const ticketingUsers = await prisma.ticketingUser.findMany()
     * 
     * // Get first 10 TicketingUsers
     * const ticketingUsers = await prisma.ticketingUser.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ticketingUserWithIdOnly = await prisma.ticketingUser.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TicketingUserFindManyArgs>(args?: SelectSubset<T, TicketingUserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TicketingUser.
     * @param {TicketingUserCreateArgs} args - Arguments to create a TicketingUser.
     * @example
     * // Create one TicketingUser
     * const TicketingUser = await prisma.ticketingUser.create({
     *   data: {
     *     // ... data to create a TicketingUser
     *   }
     * })
     * 
     */
    create<T extends TicketingUserCreateArgs>(args: SelectSubset<T, TicketingUserCreateArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TicketingUsers.
     * @param {TicketingUserCreateManyArgs} args - Arguments to create many TicketingUsers.
     * @example
     * // Create many TicketingUsers
     * const ticketingUser = await prisma.ticketingUser.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TicketingUserCreateManyArgs>(args?: SelectSubset<T, TicketingUserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TicketingUsers and returns the data saved in the database.
     * @param {TicketingUserCreateManyAndReturnArgs} args - Arguments to create many TicketingUsers.
     * @example
     * // Create many TicketingUsers
     * const ticketingUser = await prisma.ticketingUser.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TicketingUsers and only return the `id`
     * const ticketingUserWithIdOnly = await prisma.ticketingUser.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TicketingUserCreateManyAndReturnArgs>(args?: SelectSubset<T, TicketingUserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TicketingUser.
     * @param {TicketingUserDeleteArgs} args - Arguments to delete one TicketingUser.
     * @example
     * // Delete one TicketingUser
     * const TicketingUser = await prisma.ticketingUser.delete({
     *   where: {
     *     // ... filter to delete one TicketingUser
     *   }
     * })
     * 
     */
    delete<T extends TicketingUserDeleteArgs>(args: SelectSubset<T, TicketingUserDeleteArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TicketingUser.
     * @param {TicketingUserUpdateArgs} args - Arguments to update one TicketingUser.
     * @example
     * // Update one TicketingUser
     * const ticketingUser = await prisma.ticketingUser.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TicketingUserUpdateArgs>(args: SelectSubset<T, TicketingUserUpdateArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TicketingUsers.
     * @param {TicketingUserDeleteManyArgs} args - Arguments to filter TicketingUsers to delete.
     * @example
     * // Delete a few TicketingUsers
     * const { count } = await prisma.ticketingUser.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TicketingUserDeleteManyArgs>(args?: SelectSubset<T, TicketingUserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TicketingUsers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketingUserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TicketingUsers
     * const ticketingUser = await prisma.ticketingUser.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TicketingUserUpdateManyArgs>(args: SelectSubset<T, TicketingUserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TicketingUser.
     * @param {TicketingUserUpsertArgs} args - Arguments to update or create a TicketingUser.
     * @example
     * // Update or create a TicketingUser
     * const ticketingUser = await prisma.ticketingUser.upsert({
     *   create: {
     *     // ... data to create a TicketingUser
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TicketingUser we want to update
     *   }
     * })
     */
    upsert<T extends TicketingUserUpsertArgs>(args: SelectSubset<T, TicketingUserUpsertArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TicketingUsers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketingUserCountArgs} args - Arguments to filter TicketingUsers to count.
     * @example
     * // Count the number of TicketingUsers
     * const count = await prisma.ticketingUser.count({
     *   where: {
     *     // ... the filter for the TicketingUsers we want to count
     *   }
     * })
    **/
    count<T extends TicketingUserCountArgs>(
      args?: Subset<T, TicketingUserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TicketingUserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TicketingUser.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketingUserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TicketingUserAggregateArgs>(args: Subset<T, TicketingUserAggregateArgs>): Prisma.PrismaPromise<GetTicketingUserAggregateType<T>>

    /**
     * Group by TicketingUser.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketingUserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TicketingUserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TicketingUserGroupByArgs['orderBy'] }
        : { orderBy?: TicketingUserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TicketingUserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTicketingUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TicketingUser model
   */
  readonly fields: TicketingUserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TicketingUser.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TicketingUserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    organization<T extends TicketingUser$organizationArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUser$organizationArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    createdTickets<T extends TicketingUser$createdTicketsArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUser$createdTicketsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany"> | Null>
    assignedTickets<T extends TicketingUser$assignedTicketsArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUser$assignedTicketsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany"> | Null>
    messages<T extends TicketingUser$messagesArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUser$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "findMany"> | Null>
    auditLogs<T extends TicketingUser$auditLogsArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUser$auditLogsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "findMany"> | Null>
    consultantOrganizations<T extends TicketingUser$consultantOrganizationsArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUser$consultantOrganizationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TicketingUser model
   */ 
  interface TicketingUserFieldRefs {
    readonly id: FieldRef<"TicketingUser", 'String'>
    readonly email: FieldRef<"TicketingUser", 'String'>
    readonly passwordHash: FieldRef<"TicketingUser", 'String'>
    readonly name: FieldRef<"TicketingUser", 'String'>
    readonly role: FieldRef<"TicketingUser", 'TicketingUserRole'>
    readonly organizationId: FieldRef<"TicketingUser", 'String'>
    readonly consultantVerified: FieldRef<"TicketingUser", 'Boolean'>
    readonly tbosAdminUserId: FieldRef<"TicketingUser", 'String'>
    readonly tbosRole: FieldRef<"TicketingUser", 'String'>
    readonly active: FieldRef<"TicketingUser", 'Boolean'>
    readonly createdAt: FieldRef<"TicketingUser", 'DateTime'>
    readonly updatedAt: FieldRef<"TicketingUser", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TicketingUser findUnique
   */
  export type TicketingUserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * Filter, which TicketingUser to fetch.
     */
    where: TicketingUserWhereUniqueInput
  }

  /**
   * TicketingUser findUniqueOrThrow
   */
  export type TicketingUserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * Filter, which TicketingUser to fetch.
     */
    where: TicketingUserWhereUniqueInput
  }

  /**
   * TicketingUser findFirst
   */
  export type TicketingUserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * Filter, which TicketingUser to fetch.
     */
    where?: TicketingUserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketingUsers to fetch.
     */
    orderBy?: TicketingUserOrderByWithRelationInput | TicketingUserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TicketingUsers.
     */
    cursor?: TicketingUserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketingUsers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketingUsers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TicketingUsers.
     */
    distinct?: TicketingUserScalarFieldEnum | TicketingUserScalarFieldEnum[]
  }

  /**
   * TicketingUser findFirstOrThrow
   */
  export type TicketingUserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * Filter, which TicketingUser to fetch.
     */
    where?: TicketingUserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketingUsers to fetch.
     */
    orderBy?: TicketingUserOrderByWithRelationInput | TicketingUserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TicketingUsers.
     */
    cursor?: TicketingUserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketingUsers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketingUsers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TicketingUsers.
     */
    distinct?: TicketingUserScalarFieldEnum | TicketingUserScalarFieldEnum[]
  }

  /**
   * TicketingUser findMany
   */
  export type TicketingUserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * Filter, which TicketingUsers to fetch.
     */
    where?: TicketingUserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketingUsers to fetch.
     */
    orderBy?: TicketingUserOrderByWithRelationInput | TicketingUserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TicketingUsers.
     */
    cursor?: TicketingUserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketingUsers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketingUsers.
     */
    skip?: number
    distinct?: TicketingUserScalarFieldEnum | TicketingUserScalarFieldEnum[]
  }

  /**
   * TicketingUser create
   */
  export type TicketingUserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * The data needed to create a TicketingUser.
     */
    data: XOR<TicketingUserCreateInput, TicketingUserUncheckedCreateInput>
  }

  /**
   * TicketingUser createMany
   */
  export type TicketingUserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TicketingUsers.
     */
    data: TicketingUserCreateManyInput | TicketingUserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TicketingUser createManyAndReturn
   */
  export type TicketingUserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TicketingUsers.
     */
    data: TicketingUserCreateManyInput | TicketingUserCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TicketingUser update
   */
  export type TicketingUserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * The data needed to update a TicketingUser.
     */
    data: XOR<TicketingUserUpdateInput, TicketingUserUncheckedUpdateInput>
    /**
     * Choose, which TicketingUser to update.
     */
    where: TicketingUserWhereUniqueInput
  }

  /**
   * TicketingUser updateMany
   */
  export type TicketingUserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TicketingUsers.
     */
    data: XOR<TicketingUserUpdateManyMutationInput, TicketingUserUncheckedUpdateManyInput>
    /**
     * Filter which TicketingUsers to update
     */
    where?: TicketingUserWhereInput
  }

  /**
   * TicketingUser upsert
   */
  export type TicketingUserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * The filter to search for the TicketingUser to update in case it exists.
     */
    where: TicketingUserWhereUniqueInput
    /**
     * In case the TicketingUser found by the `where` argument doesn't exist, create a new TicketingUser with this data.
     */
    create: XOR<TicketingUserCreateInput, TicketingUserUncheckedCreateInput>
    /**
     * In case the TicketingUser was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TicketingUserUpdateInput, TicketingUserUncheckedUpdateInput>
  }

  /**
   * TicketingUser delete
   */
  export type TicketingUserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    /**
     * Filter which TicketingUser to delete.
     */
    where: TicketingUserWhereUniqueInput
  }

  /**
   * TicketingUser deleteMany
   */
  export type TicketingUserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TicketingUsers to delete
     */
    where?: TicketingUserWhereInput
  }

  /**
   * TicketingUser.organization
   */
  export type TicketingUser$organizationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: OrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrganizationInclude<ExtArgs> | null
    where?: OrganizationWhereInput
  }

  /**
   * TicketingUser.createdTickets
   */
  export type TicketingUser$createdTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    cursor?: TicketWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * TicketingUser.assignedTickets
   */
  export type TicketingUser$assignedTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    cursor?: TicketWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * TicketingUser.messages
   */
  export type TicketingUser$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    where?: TicketMessageWhereInput
    orderBy?: TicketMessageOrderByWithRelationInput | TicketMessageOrderByWithRelationInput[]
    cursor?: TicketMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketMessageScalarFieldEnum | TicketMessageScalarFieldEnum[]
  }

  /**
   * TicketingUser.auditLogs
   */
  export type TicketingUser$auditLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    where?: TicketAuditLogWhereInput
    orderBy?: TicketAuditLogOrderByWithRelationInput | TicketAuditLogOrderByWithRelationInput[]
    cursor?: TicketAuditLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketAuditLogScalarFieldEnum | TicketAuditLogScalarFieldEnum[]
  }

  /**
   * TicketingUser.consultantOrganizations
   */
  export type TicketingUser$consultantOrganizationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    where?: ConsultantOrganizationWhereInput
    orderBy?: ConsultantOrganizationOrderByWithRelationInput | ConsultantOrganizationOrderByWithRelationInput[]
    cursor?: ConsultantOrganizationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConsultantOrganizationScalarFieldEnum | ConsultantOrganizationScalarFieldEnum[]
  }

  /**
   * TicketingUser without action
   */
  export type TicketingUserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
  }


  /**
   * Model ConsultantOrganization
   */

  export type AggregateConsultantOrganization = {
    _count: ConsultantOrganizationCountAggregateOutputType | null
    _min: ConsultantOrganizationMinAggregateOutputType | null
    _max: ConsultantOrganizationMaxAggregateOutputType | null
  }

  export type ConsultantOrganizationMinAggregateOutputType = {
    id: string | null
    consultantId: string | null
    organizationId: string | null
    createdAt: Date | null
  }

  export type ConsultantOrganizationMaxAggregateOutputType = {
    id: string | null
    consultantId: string | null
    organizationId: string | null
    createdAt: Date | null
  }

  export type ConsultantOrganizationCountAggregateOutputType = {
    id: number
    consultantId: number
    organizationId: number
    createdAt: number
    _all: number
  }


  export type ConsultantOrganizationMinAggregateInputType = {
    id?: true
    consultantId?: true
    organizationId?: true
    createdAt?: true
  }

  export type ConsultantOrganizationMaxAggregateInputType = {
    id?: true
    consultantId?: true
    organizationId?: true
    createdAt?: true
  }

  export type ConsultantOrganizationCountAggregateInputType = {
    id?: true
    consultantId?: true
    organizationId?: true
    createdAt?: true
    _all?: true
  }

  export type ConsultantOrganizationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConsultantOrganization to aggregate.
     */
    where?: ConsultantOrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConsultantOrganizations to fetch.
     */
    orderBy?: ConsultantOrganizationOrderByWithRelationInput | ConsultantOrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConsultantOrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConsultantOrganizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConsultantOrganizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ConsultantOrganizations
    **/
    _count?: true | ConsultantOrganizationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConsultantOrganizationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConsultantOrganizationMaxAggregateInputType
  }

  export type GetConsultantOrganizationAggregateType<T extends ConsultantOrganizationAggregateArgs> = {
        [P in keyof T & keyof AggregateConsultantOrganization]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConsultantOrganization[P]>
      : GetScalarType<T[P], AggregateConsultantOrganization[P]>
  }




  export type ConsultantOrganizationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConsultantOrganizationWhereInput
    orderBy?: ConsultantOrganizationOrderByWithAggregationInput | ConsultantOrganizationOrderByWithAggregationInput[]
    by: ConsultantOrganizationScalarFieldEnum[] | ConsultantOrganizationScalarFieldEnum
    having?: ConsultantOrganizationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConsultantOrganizationCountAggregateInputType | true
    _min?: ConsultantOrganizationMinAggregateInputType
    _max?: ConsultantOrganizationMaxAggregateInputType
  }

  export type ConsultantOrganizationGroupByOutputType = {
    id: string
    consultantId: string
    organizationId: string
    createdAt: Date
    _count: ConsultantOrganizationCountAggregateOutputType | null
    _min: ConsultantOrganizationMinAggregateOutputType | null
    _max: ConsultantOrganizationMaxAggregateOutputType | null
  }

  type GetConsultantOrganizationGroupByPayload<T extends ConsultantOrganizationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConsultantOrganizationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConsultantOrganizationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConsultantOrganizationGroupByOutputType[P]>
            : GetScalarType<T[P], ConsultantOrganizationGroupByOutputType[P]>
        }
      >
    >


  export type ConsultantOrganizationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    consultantId?: boolean
    organizationId?: boolean
    createdAt?: boolean
    consultant?: boolean | TicketingUserDefaultArgs<ExtArgs>
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["consultantOrganization"]>

  export type ConsultantOrganizationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    consultantId?: boolean
    organizationId?: boolean
    createdAt?: boolean
    consultant?: boolean | TicketingUserDefaultArgs<ExtArgs>
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["consultantOrganization"]>

  export type ConsultantOrganizationSelectScalar = {
    id?: boolean
    consultantId?: boolean
    organizationId?: boolean
    createdAt?: boolean
  }

  export type ConsultantOrganizationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    consultant?: boolean | TicketingUserDefaultArgs<ExtArgs>
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }
  export type ConsultantOrganizationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    consultant?: boolean | TicketingUserDefaultArgs<ExtArgs>
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
  }

  export type $ConsultantOrganizationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConsultantOrganization"
    objects: {
      consultant: Prisma.$TicketingUserPayload<ExtArgs>
      organization: Prisma.$OrganizationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      consultantId: string
      organizationId: string
      createdAt: Date
    }, ExtArgs["result"]["consultantOrganization"]>
    composites: {}
  }

  type ConsultantOrganizationGetPayload<S extends boolean | null | undefined | ConsultantOrganizationDefaultArgs> = $Result.GetResult<Prisma.$ConsultantOrganizationPayload, S>

  type ConsultantOrganizationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ConsultantOrganizationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ConsultantOrganizationCountAggregateInputType | true
    }

  export interface ConsultantOrganizationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConsultantOrganization'], meta: { name: 'ConsultantOrganization' } }
    /**
     * Find zero or one ConsultantOrganization that matches the filter.
     * @param {ConsultantOrganizationFindUniqueArgs} args - Arguments to find a ConsultantOrganization
     * @example
     * // Get one ConsultantOrganization
     * const consultantOrganization = await prisma.consultantOrganization.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConsultantOrganizationFindUniqueArgs>(args: SelectSubset<T, ConsultantOrganizationFindUniqueArgs<ExtArgs>>): Prisma__ConsultantOrganizationClient<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ConsultantOrganization that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ConsultantOrganizationFindUniqueOrThrowArgs} args - Arguments to find a ConsultantOrganization
     * @example
     * // Get one ConsultantOrganization
     * const consultantOrganization = await prisma.consultantOrganization.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConsultantOrganizationFindUniqueOrThrowArgs>(args: SelectSubset<T, ConsultantOrganizationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConsultantOrganizationClient<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ConsultantOrganization that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsultantOrganizationFindFirstArgs} args - Arguments to find a ConsultantOrganization
     * @example
     * // Get one ConsultantOrganization
     * const consultantOrganization = await prisma.consultantOrganization.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConsultantOrganizationFindFirstArgs>(args?: SelectSubset<T, ConsultantOrganizationFindFirstArgs<ExtArgs>>): Prisma__ConsultantOrganizationClient<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ConsultantOrganization that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsultantOrganizationFindFirstOrThrowArgs} args - Arguments to find a ConsultantOrganization
     * @example
     * // Get one ConsultantOrganization
     * const consultantOrganization = await prisma.consultantOrganization.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConsultantOrganizationFindFirstOrThrowArgs>(args?: SelectSubset<T, ConsultantOrganizationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConsultantOrganizationClient<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ConsultantOrganizations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsultantOrganizationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConsultantOrganizations
     * const consultantOrganizations = await prisma.consultantOrganization.findMany()
     * 
     * // Get first 10 ConsultantOrganizations
     * const consultantOrganizations = await prisma.consultantOrganization.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const consultantOrganizationWithIdOnly = await prisma.consultantOrganization.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConsultantOrganizationFindManyArgs>(args?: SelectSubset<T, ConsultantOrganizationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ConsultantOrganization.
     * @param {ConsultantOrganizationCreateArgs} args - Arguments to create a ConsultantOrganization.
     * @example
     * // Create one ConsultantOrganization
     * const ConsultantOrganization = await prisma.consultantOrganization.create({
     *   data: {
     *     // ... data to create a ConsultantOrganization
     *   }
     * })
     * 
     */
    create<T extends ConsultantOrganizationCreateArgs>(args: SelectSubset<T, ConsultantOrganizationCreateArgs<ExtArgs>>): Prisma__ConsultantOrganizationClient<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ConsultantOrganizations.
     * @param {ConsultantOrganizationCreateManyArgs} args - Arguments to create many ConsultantOrganizations.
     * @example
     * // Create many ConsultantOrganizations
     * const consultantOrganization = await prisma.consultantOrganization.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConsultantOrganizationCreateManyArgs>(args?: SelectSubset<T, ConsultantOrganizationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ConsultantOrganizations and returns the data saved in the database.
     * @param {ConsultantOrganizationCreateManyAndReturnArgs} args - Arguments to create many ConsultantOrganizations.
     * @example
     * // Create many ConsultantOrganizations
     * const consultantOrganization = await prisma.consultantOrganization.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ConsultantOrganizations and only return the `id`
     * const consultantOrganizationWithIdOnly = await prisma.consultantOrganization.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConsultantOrganizationCreateManyAndReturnArgs>(args?: SelectSubset<T, ConsultantOrganizationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ConsultantOrganization.
     * @param {ConsultantOrganizationDeleteArgs} args - Arguments to delete one ConsultantOrganization.
     * @example
     * // Delete one ConsultantOrganization
     * const ConsultantOrganization = await prisma.consultantOrganization.delete({
     *   where: {
     *     // ... filter to delete one ConsultantOrganization
     *   }
     * })
     * 
     */
    delete<T extends ConsultantOrganizationDeleteArgs>(args: SelectSubset<T, ConsultantOrganizationDeleteArgs<ExtArgs>>): Prisma__ConsultantOrganizationClient<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ConsultantOrganization.
     * @param {ConsultantOrganizationUpdateArgs} args - Arguments to update one ConsultantOrganization.
     * @example
     * // Update one ConsultantOrganization
     * const consultantOrganization = await prisma.consultantOrganization.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConsultantOrganizationUpdateArgs>(args: SelectSubset<T, ConsultantOrganizationUpdateArgs<ExtArgs>>): Prisma__ConsultantOrganizationClient<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ConsultantOrganizations.
     * @param {ConsultantOrganizationDeleteManyArgs} args - Arguments to filter ConsultantOrganizations to delete.
     * @example
     * // Delete a few ConsultantOrganizations
     * const { count } = await prisma.consultantOrganization.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConsultantOrganizationDeleteManyArgs>(args?: SelectSubset<T, ConsultantOrganizationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConsultantOrganizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsultantOrganizationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConsultantOrganizations
     * const consultantOrganization = await prisma.consultantOrganization.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConsultantOrganizationUpdateManyArgs>(args: SelectSubset<T, ConsultantOrganizationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ConsultantOrganization.
     * @param {ConsultantOrganizationUpsertArgs} args - Arguments to update or create a ConsultantOrganization.
     * @example
     * // Update or create a ConsultantOrganization
     * const consultantOrganization = await prisma.consultantOrganization.upsert({
     *   create: {
     *     // ... data to create a ConsultantOrganization
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConsultantOrganization we want to update
     *   }
     * })
     */
    upsert<T extends ConsultantOrganizationUpsertArgs>(args: SelectSubset<T, ConsultantOrganizationUpsertArgs<ExtArgs>>): Prisma__ConsultantOrganizationClient<$Result.GetResult<Prisma.$ConsultantOrganizationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ConsultantOrganizations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsultantOrganizationCountArgs} args - Arguments to filter ConsultantOrganizations to count.
     * @example
     * // Count the number of ConsultantOrganizations
     * const count = await prisma.consultantOrganization.count({
     *   where: {
     *     // ... the filter for the ConsultantOrganizations we want to count
     *   }
     * })
    **/
    count<T extends ConsultantOrganizationCountArgs>(
      args?: Subset<T, ConsultantOrganizationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConsultantOrganizationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConsultantOrganization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsultantOrganizationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConsultantOrganizationAggregateArgs>(args: Subset<T, ConsultantOrganizationAggregateArgs>): Prisma.PrismaPromise<GetConsultantOrganizationAggregateType<T>>

    /**
     * Group by ConsultantOrganization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsultantOrganizationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConsultantOrganizationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConsultantOrganizationGroupByArgs['orderBy'] }
        : { orderBy?: ConsultantOrganizationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConsultantOrganizationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConsultantOrganizationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConsultantOrganization model
   */
  readonly fields: ConsultantOrganizationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConsultantOrganization.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConsultantOrganizationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    consultant<T extends TicketingUserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUserDefaultArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    organization<T extends OrganizationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, OrganizationDefaultArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ConsultantOrganization model
   */ 
  interface ConsultantOrganizationFieldRefs {
    readonly id: FieldRef<"ConsultantOrganization", 'String'>
    readonly consultantId: FieldRef<"ConsultantOrganization", 'String'>
    readonly organizationId: FieldRef<"ConsultantOrganization", 'String'>
    readonly createdAt: FieldRef<"ConsultantOrganization", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ConsultantOrganization findUnique
   */
  export type ConsultantOrganizationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which ConsultantOrganization to fetch.
     */
    where: ConsultantOrganizationWhereUniqueInput
  }

  /**
   * ConsultantOrganization findUniqueOrThrow
   */
  export type ConsultantOrganizationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which ConsultantOrganization to fetch.
     */
    where: ConsultantOrganizationWhereUniqueInput
  }

  /**
   * ConsultantOrganization findFirst
   */
  export type ConsultantOrganizationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which ConsultantOrganization to fetch.
     */
    where?: ConsultantOrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConsultantOrganizations to fetch.
     */
    orderBy?: ConsultantOrganizationOrderByWithRelationInput | ConsultantOrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConsultantOrganizations.
     */
    cursor?: ConsultantOrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConsultantOrganizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConsultantOrganizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConsultantOrganizations.
     */
    distinct?: ConsultantOrganizationScalarFieldEnum | ConsultantOrganizationScalarFieldEnum[]
  }

  /**
   * ConsultantOrganization findFirstOrThrow
   */
  export type ConsultantOrganizationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which ConsultantOrganization to fetch.
     */
    where?: ConsultantOrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConsultantOrganizations to fetch.
     */
    orderBy?: ConsultantOrganizationOrderByWithRelationInput | ConsultantOrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConsultantOrganizations.
     */
    cursor?: ConsultantOrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConsultantOrganizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConsultantOrganizations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConsultantOrganizations.
     */
    distinct?: ConsultantOrganizationScalarFieldEnum | ConsultantOrganizationScalarFieldEnum[]
  }

  /**
   * ConsultantOrganization findMany
   */
  export type ConsultantOrganizationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * Filter, which ConsultantOrganizations to fetch.
     */
    where?: ConsultantOrganizationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConsultantOrganizations to fetch.
     */
    orderBy?: ConsultantOrganizationOrderByWithRelationInput | ConsultantOrganizationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ConsultantOrganizations.
     */
    cursor?: ConsultantOrganizationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConsultantOrganizations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConsultantOrganizations.
     */
    skip?: number
    distinct?: ConsultantOrganizationScalarFieldEnum | ConsultantOrganizationScalarFieldEnum[]
  }

  /**
   * ConsultantOrganization create
   */
  export type ConsultantOrganizationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * The data needed to create a ConsultantOrganization.
     */
    data: XOR<ConsultantOrganizationCreateInput, ConsultantOrganizationUncheckedCreateInput>
  }

  /**
   * ConsultantOrganization createMany
   */
  export type ConsultantOrganizationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConsultantOrganizations.
     */
    data: ConsultantOrganizationCreateManyInput | ConsultantOrganizationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ConsultantOrganization createManyAndReturn
   */
  export type ConsultantOrganizationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ConsultantOrganizations.
     */
    data: ConsultantOrganizationCreateManyInput | ConsultantOrganizationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ConsultantOrganization update
   */
  export type ConsultantOrganizationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * The data needed to update a ConsultantOrganization.
     */
    data: XOR<ConsultantOrganizationUpdateInput, ConsultantOrganizationUncheckedUpdateInput>
    /**
     * Choose, which ConsultantOrganization to update.
     */
    where: ConsultantOrganizationWhereUniqueInput
  }

  /**
   * ConsultantOrganization updateMany
   */
  export type ConsultantOrganizationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConsultantOrganizations.
     */
    data: XOR<ConsultantOrganizationUpdateManyMutationInput, ConsultantOrganizationUncheckedUpdateManyInput>
    /**
     * Filter which ConsultantOrganizations to update
     */
    where?: ConsultantOrganizationWhereInput
  }

  /**
   * ConsultantOrganization upsert
   */
  export type ConsultantOrganizationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * The filter to search for the ConsultantOrganization to update in case it exists.
     */
    where: ConsultantOrganizationWhereUniqueInput
    /**
     * In case the ConsultantOrganization found by the `where` argument doesn't exist, create a new ConsultantOrganization with this data.
     */
    create: XOR<ConsultantOrganizationCreateInput, ConsultantOrganizationUncheckedCreateInput>
    /**
     * In case the ConsultantOrganization was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConsultantOrganizationUpdateInput, ConsultantOrganizationUncheckedUpdateInput>
  }

  /**
   * ConsultantOrganization delete
   */
  export type ConsultantOrganizationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
    /**
     * Filter which ConsultantOrganization to delete.
     */
    where: ConsultantOrganizationWhereUniqueInput
  }

  /**
   * ConsultantOrganization deleteMany
   */
  export type ConsultantOrganizationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConsultantOrganizations to delete
     */
    where?: ConsultantOrganizationWhereInput
  }

  /**
   * ConsultantOrganization without action
   */
  export type ConsultantOrganizationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsultantOrganization
     */
    select?: ConsultantOrganizationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConsultantOrganizationInclude<ExtArgs> | null
  }


  /**
   * Model Ticket
   */

  export type AggregateTicket = {
    _count: TicketCountAggregateOutputType | null
    _min: TicketMinAggregateOutputType | null
    _max: TicketMaxAggregateOutputType | null
  }

  export type TicketMinAggregateOutputType = {
    id: string | null
    ticketNumber: string | null
    organizationId: string | null
    type: $Enums.TicketType | null
    priority: $Enums.TicketPriority | null
    status: $Enums.TicketStatus | null
    subject: string | null
    description: string | null
    createdById: string | null
    assignedToId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    closedAt: Date | null
  }

  export type TicketMaxAggregateOutputType = {
    id: string | null
    ticketNumber: string | null
    organizationId: string | null
    type: $Enums.TicketType | null
    priority: $Enums.TicketPriority | null
    status: $Enums.TicketStatus | null
    subject: string | null
    description: string | null
    createdById: string | null
    assignedToId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    closedAt: Date | null
  }

  export type TicketCountAggregateOutputType = {
    id: number
    ticketNumber: number
    organizationId: number
    type: number
    priority: number
    status: number
    subject: number
    description: number
    createdById: number
    assignedToId: number
    createdAt: number
    updatedAt: number
    closedAt: number
    _all: number
  }


  export type TicketMinAggregateInputType = {
    id?: true
    ticketNumber?: true
    organizationId?: true
    type?: true
    priority?: true
    status?: true
    subject?: true
    description?: true
    createdById?: true
    assignedToId?: true
    createdAt?: true
    updatedAt?: true
    closedAt?: true
  }

  export type TicketMaxAggregateInputType = {
    id?: true
    ticketNumber?: true
    organizationId?: true
    type?: true
    priority?: true
    status?: true
    subject?: true
    description?: true
    createdById?: true
    assignedToId?: true
    createdAt?: true
    updatedAt?: true
    closedAt?: true
  }

  export type TicketCountAggregateInputType = {
    id?: true
    ticketNumber?: true
    organizationId?: true
    type?: true
    priority?: true
    status?: true
    subject?: true
    description?: true
    createdById?: true
    assignedToId?: true
    createdAt?: true
    updatedAt?: true
    closedAt?: true
    _all?: true
  }

  export type TicketAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Ticket to aggregate.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tickets
    **/
    _count?: true | TicketCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TicketMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TicketMaxAggregateInputType
  }

  export type GetTicketAggregateType<T extends TicketAggregateArgs> = {
        [P in keyof T & keyof AggregateTicket]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTicket[P]>
      : GetScalarType<T[P], AggregateTicket[P]>
  }




  export type TicketGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithAggregationInput | TicketOrderByWithAggregationInput[]
    by: TicketScalarFieldEnum[] | TicketScalarFieldEnum
    having?: TicketScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TicketCountAggregateInputType | true
    _min?: TicketMinAggregateInputType
    _max?: TicketMaxAggregateInputType
  }

  export type TicketGroupByOutputType = {
    id: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority: $Enums.TicketPriority
    status: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    assignedToId: string | null
    createdAt: Date
    updatedAt: Date
    closedAt: Date | null
    _count: TicketCountAggregateOutputType | null
    _min: TicketMinAggregateOutputType | null
    _max: TicketMaxAggregateOutputType | null
  }

  type GetTicketGroupByPayload<T extends TicketGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TicketGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TicketGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TicketGroupByOutputType[P]>
            : GetScalarType<T[P], TicketGroupByOutputType[P]>
        }
      >
    >


  export type TicketSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketNumber?: boolean
    organizationId?: boolean
    type?: boolean
    priority?: boolean
    status?: boolean
    subject?: boolean
    description?: boolean
    createdById?: boolean
    assignedToId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    closedAt?: boolean
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
    createdBy?: boolean | TicketingUserDefaultArgs<ExtArgs>
    assignedTo?: boolean | Ticket$assignedToArgs<ExtArgs>
    messages?: boolean | Ticket$messagesArgs<ExtArgs>
    attachments?: boolean | Ticket$attachmentsArgs<ExtArgs>
    auditLogs?: boolean | Ticket$auditLogsArgs<ExtArgs>
    _count?: boolean | TicketCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticket"]>

  export type TicketSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketNumber?: boolean
    organizationId?: boolean
    type?: boolean
    priority?: boolean
    status?: boolean
    subject?: boolean
    description?: boolean
    createdById?: boolean
    assignedToId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    closedAt?: boolean
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
    createdBy?: boolean | TicketingUserDefaultArgs<ExtArgs>
    assignedTo?: boolean | Ticket$assignedToArgs<ExtArgs>
  }, ExtArgs["result"]["ticket"]>

  export type TicketSelectScalar = {
    id?: boolean
    ticketNumber?: boolean
    organizationId?: boolean
    type?: boolean
    priority?: boolean
    status?: boolean
    subject?: boolean
    description?: boolean
    createdById?: boolean
    assignedToId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    closedAt?: boolean
  }

  export type TicketInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
    createdBy?: boolean | TicketingUserDefaultArgs<ExtArgs>
    assignedTo?: boolean | Ticket$assignedToArgs<ExtArgs>
    messages?: boolean | Ticket$messagesArgs<ExtArgs>
    attachments?: boolean | Ticket$attachmentsArgs<ExtArgs>
    auditLogs?: boolean | Ticket$auditLogsArgs<ExtArgs>
    _count?: boolean | TicketCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TicketIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    organization?: boolean | OrganizationDefaultArgs<ExtArgs>
    createdBy?: boolean | TicketingUserDefaultArgs<ExtArgs>
    assignedTo?: boolean | Ticket$assignedToArgs<ExtArgs>
  }

  export type $TicketPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Ticket"
    objects: {
      organization: Prisma.$OrganizationPayload<ExtArgs>
      createdBy: Prisma.$TicketingUserPayload<ExtArgs>
      assignedTo: Prisma.$TicketingUserPayload<ExtArgs> | null
      messages: Prisma.$TicketMessagePayload<ExtArgs>[]
      attachments: Prisma.$TicketAttachmentPayload<ExtArgs>[]
      auditLogs: Prisma.$TicketAuditLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketNumber: string
      organizationId: string
      type: $Enums.TicketType
      priority: $Enums.TicketPriority
      status: $Enums.TicketStatus
      subject: string
      description: string
      createdById: string
      assignedToId: string | null
      createdAt: Date
      updatedAt: Date
      closedAt: Date | null
    }, ExtArgs["result"]["ticket"]>
    composites: {}
  }

  type TicketGetPayload<S extends boolean | null | undefined | TicketDefaultArgs> = $Result.GetResult<Prisma.$TicketPayload, S>

  type TicketCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TicketFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TicketCountAggregateInputType | true
    }

  export interface TicketDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Ticket'], meta: { name: 'Ticket' } }
    /**
     * Find zero or one Ticket that matches the filter.
     * @param {TicketFindUniqueArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TicketFindUniqueArgs>(args: SelectSubset<T, TicketFindUniqueArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Ticket that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TicketFindUniqueOrThrowArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TicketFindUniqueOrThrowArgs>(args: SelectSubset<T, TicketFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Ticket that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindFirstArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TicketFindFirstArgs>(args?: SelectSubset<T, TicketFindFirstArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Ticket that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindFirstOrThrowArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TicketFindFirstOrThrowArgs>(args?: SelectSubset<T, TicketFindFirstOrThrowArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Tickets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tickets
     * const tickets = await prisma.ticket.findMany()
     * 
     * // Get first 10 Tickets
     * const tickets = await prisma.ticket.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ticketWithIdOnly = await prisma.ticket.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TicketFindManyArgs>(args?: SelectSubset<T, TicketFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Ticket.
     * @param {TicketCreateArgs} args - Arguments to create a Ticket.
     * @example
     * // Create one Ticket
     * const Ticket = await prisma.ticket.create({
     *   data: {
     *     // ... data to create a Ticket
     *   }
     * })
     * 
     */
    create<T extends TicketCreateArgs>(args: SelectSubset<T, TicketCreateArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Tickets.
     * @param {TicketCreateManyArgs} args - Arguments to create many Tickets.
     * @example
     * // Create many Tickets
     * const ticket = await prisma.ticket.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TicketCreateManyArgs>(args?: SelectSubset<T, TicketCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tickets and returns the data saved in the database.
     * @param {TicketCreateManyAndReturnArgs} args - Arguments to create many Tickets.
     * @example
     * // Create many Tickets
     * const ticket = await prisma.ticket.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tickets and only return the `id`
     * const ticketWithIdOnly = await prisma.ticket.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TicketCreateManyAndReturnArgs>(args?: SelectSubset<T, TicketCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Ticket.
     * @param {TicketDeleteArgs} args - Arguments to delete one Ticket.
     * @example
     * // Delete one Ticket
     * const Ticket = await prisma.ticket.delete({
     *   where: {
     *     // ... filter to delete one Ticket
     *   }
     * })
     * 
     */
    delete<T extends TicketDeleteArgs>(args: SelectSubset<T, TicketDeleteArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Ticket.
     * @param {TicketUpdateArgs} args - Arguments to update one Ticket.
     * @example
     * // Update one Ticket
     * const ticket = await prisma.ticket.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TicketUpdateArgs>(args: SelectSubset<T, TicketUpdateArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Tickets.
     * @param {TicketDeleteManyArgs} args - Arguments to filter Tickets to delete.
     * @example
     * // Delete a few Tickets
     * const { count } = await prisma.ticket.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TicketDeleteManyArgs>(args?: SelectSubset<T, TicketDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tickets
     * const ticket = await prisma.ticket.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TicketUpdateManyArgs>(args: SelectSubset<T, TicketUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Ticket.
     * @param {TicketUpsertArgs} args - Arguments to update or create a Ticket.
     * @example
     * // Update or create a Ticket
     * const ticket = await prisma.ticket.upsert({
     *   create: {
     *     // ... data to create a Ticket
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Ticket we want to update
     *   }
     * })
     */
    upsert<T extends TicketUpsertArgs>(args: SelectSubset<T, TicketUpsertArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Tickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketCountArgs} args - Arguments to filter Tickets to count.
     * @example
     * // Count the number of Tickets
     * const count = await prisma.ticket.count({
     *   where: {
     *     // ... the filter for the Tickets we want to count
     *   }
     * })
    **/
    count<T extends TicketCountArgs>(
      args?: Subset<T, TicketCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TicketCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Ticket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TicketAggregateArgs>(args: Subset<T, TicketAggregateArgs>): Prisma.PrismaPromise<GetTicketAggregateType<T>>

    /**
     * Group by Ticket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TicketGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TicketGroupByArgs['orderBy'] }
        : { orderBy?: TicketGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TicketGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTicketGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Ticket model
   */
  readonly fields: TicketFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Ticket.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TicketClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    organization<T extends OrganizationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, OrganizationDefaultArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    createdBy<T extends TicketingUserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUserDefaultArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    assignedTo<T extends Ticket$assignedToArgs<ExtArgs> = {}>(args?: Subset<T, Ticket$assignedToArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    messages<T extends Ticket$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Ticket$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "findMany"> | Null>
    attachments<T extends Ticket$attachmentsArgs<ExtArgs> = {}>(args?: Subset<T, Ticket$attachmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "findMany"> | Null>
    auditLogs<T extends Ticket$auditLogsArgs<ExtArgs> = {}>(args?: Subset<T, Ticket$auditLogsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Ticket model
   */ 
  interface TicketFieldRefs {
    readonly id: FieldRef<"Ticket", 'String'>
    readonly ticketNumber: FieldRef<"Ticket", 'String'>
    readonly organizationId: FieldRef<"Ticket", 'String'>
    readonly type: FieldRef<"Ticket", 'TicketType'>
    readonly priority: FieldRef<"Ticket", 'TicketPriority'>
    readonly status: FieldRef<"Ticket", 'TicketStatus'>
    readonly subject: FieldRef<"Ticket", 'String'>
    readonly description: FieldRef<"Ticket", 'String'>
    readonly createdById: FieldRef<"Ticket", 'String'>
    readonly assignedToId: FieldRef<"Ticket", 'String'>
    readonly createdAt: FieldRef<"Ticket", 'DateTime'>
    readonly updatedAt: FieldRef<"Ticket", 'DateTime'>
    readonly closedAt: FieldRef<"Ticket", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Ticket findUnique
   */
  export type TicketFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket findUniqueOrThrow
   */
  export type TicketFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket findFirst
   */
  export type TicketFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tickets.
     */
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket findFirstOrThrow
   */
  export type TicketFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tickets.
     */
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket findMany
   */
  export type TicketFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Tickets to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket create
   */
  export type TicketCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The data needed to create a Ticket.
     */
    data: XOR<TicketCreateInput, TicketUncheckedCreateInput>
  }

  /**
   * Ticket createMany
   */
  export type TicketCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tickets.
     */
    data: TicketCreateManyInput | TicketCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Ticket createManyAndReturn
   */
  export type TicketCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Tickets.
     */
    data: TicketCreateManyInput | TicketCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Ticket update
   */
  export type TicketUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The data needed to update a Ticket.
     */
    data: XOR<TicketUpdateInput, TicketUncheckedUpdateInput>
    /**
     * Choose, which Ticket to update.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket updateMany
   */
  export type TicketUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tickets.
     */
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyInput>
    /**
     * Filter which Tickets to update
     */
    where?: TicketWhereInput
  }

  /**
   * Ticket upsert
   */
  export type TicketUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The filter to search for the Ticket to update in case it exists.
     */
    where: TicketWhereUniqueInput
    /**
     * In case the Ticket found by the `where` argument doesn't exist, create a new Ticket with this data.
     */
    create: XOR<TicketCreateInput, TicketUncheckedCreateInput>
    /**
     * In case the Ticket was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TicketUpdateInput, TicketUncheckedUpdateInput>
  }

  /**
   * Ticket delete
   */
  export type TicketDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter which Ticket to delete.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket deleteMany
   */
  export type TicketDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tickets to delete
     */
    where?: TicketWhereInput
  }

  /**
   * Ticket.assignedTo
   */
  export type Ticket$assignedToArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    where?: TicketingUserWhereInput
  }

  /**
   * Ticket.messages
   */
  export type Ticket$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    where?: TicketMessageWhereInput
    orderBy?: TicketMessageOrderByWithRelationInput | TicketMessageOrderByWithRelationInput[]
    cursor?: TicketMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketMessageScalarFieldEnum | TicketMessageScalarFieldEnum[]
  }

  /**
   * Ticket.attachments
   */
  export type Ticket$attachmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    where?: TicketAttachmentWhereInput
    orderBy?: TicketAttachmentOrderByWithRelationInput | TicketAttachmentOrderByWithRelationInput[]
    cursor?: TicketAttachmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketAttachmentScalarFieldEnum | TicketAttachmentScalarFieldEnum[]
  }

  /**
   * Ticket.auditLogs
   */
  export type Ticket$auditLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    where?: TicketAuditLogWhereInput
    orderBy?: TicketAuditLogOrderByWithRelationInput | TicketAuditLogOrderByWithRelationInput[]
    cursor?: TicketAuditLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketAuditLogScalarFieldEnum | TicketAuditLogScalarFieldEnum[]
  }

  /**
   * Ticket without action
   */
  export type TicketDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
  }


  /**
   * Model TicketMessage
   */

  export type AggregateTicketMessage = {
    _count: TicketMessageCountAggregateOutputType | null
    _min: TicketMessageMinAggregateOutputType | null
    _max: TicketMessageMaxAggregateOutputType | null
  }

  export type TicketMessageMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    authorId: string | null
    body: string | null
    isInternal: boolean | null
    createdAt: Date | null
  }

  export type TicketMessageMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    authorId: string | null
    body: string | null
    isInternal: boolean | null
    createdAt: Date | null
  }

  export type TicketMessageCountAggregateOutputType = {
    id: number
    ticketId: number
    authorId: number
    body: number
    isInternal: number
    createdAt: number
    _all: number
  }


  export type TicketMessageMinAggregateInputType = {
    id?: true
    ticketId?: true
    authorId?: true
    body?: true
    isInternal?: true
    createdAt?: true
  }

  export type TicketMessageMaxAggregateInputType = {
    id?: true
    ticketId?: true
    authorId?: true
    body?: true
    isInternal?: true
    createdAt?: true
  }

  export type TicketMessageCountAggregateInputType = {
    id?: true
    ticketId?: true
    authorId?: true
    body?: true
    isInternal?: true
    createdAt?: true
    _all?: true
  }

  export type TicketMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TicketMessage to aggregate.
     */
    where?: TicketMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketMessages to fetch.
     */
    orderBy?: TicketMessageOrderByWithRelationInput | TicketMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TicketMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TicketMessages
    **/
    _count?: true | TicketMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TicketMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TicketMessageMaxAggregateInputType
  }

  export type GetTicketMessageAggregateType<T extends TicketMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateTicketMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTicketMessage[P]>
      : GetScalarType<T[P], AggregateTicketMessage[P]>
  }




  export type TicketMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketMessageWhereInput
    orderBy?: TicketMessageOrderByWithAggregationInput | TicketMessageOrderByWithAggregationInput[]
    by: TicketMessageScalarFieldEnum[] | TicketMessageScalarFieldEnum
    having?: TicketMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TicketMessageCountAggregateInputType | true
    _min?: TicketMessageMinAggregateInputType
    _max?: TicketMessageMaxAggregateInputType
  }

  export type TicketMessageGroupByOutputType = {
    id: string
    ticketId: string
    authorId: string
    body: string
    isInternal: boolean
    createdAt: Date
    _count: TicketMessageCountAggregateOutputType | null
    _min: TicketMessageMinAggregateOutputType | null
    _max: TicketMessageMaxAggregateOutputType | null
  }

  type GetTicketMessageGroupByPayload<T extends TicketMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TicketMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TicketMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TicketMessageGroupByOutputType[P]>
            : GetScalarType<T[P], TicketMessageGroupByOutputType[P]>
        }
      >
    >


  export type TicketMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    authorId?: boolean
    body?: boolean
    isInternal?: boolean
    createdAt?: boolean
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    author?: boolean | TicketingUserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticketMessage"]>

  export type TicketMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    authorId?: boolean
    body?: boolean
    isInternal?: boolean
    createdAt?: boolean
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    author?: boolean | TicketingUserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticketMessage"]>

  export type TicketMessageSelectScalar = {
    id?: boolean
    ticketId?: boolean
    authorId?: boolean
    body?: boolean
    isInternal?: boolean
    createdAt?: boolean
  }

  export type TicketMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    author?: boolean | TicketingUserDefaultArgs<ExtArgs>
  }
  export type TicketMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    author?: boolean | TicketingUserDefaultArgs<ExtArgs>
  }

  export type $TicketMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TicketMessage"
    objects: {
      ticket: Prisma.$TicketPayload<ExtArgs>
      author: Prisma.$TicketingUserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      authorId: string
      body: string
      isInternal: boolean
      createdAt: Date
    }, ExtArgs["result"]["ticketMessage"]>
    composites: {}
  }

  type TicketMessageGetPayload<S extends boolean | null | undefined | TicketMessageDefaultArgs> = $Result.GetResult<Prisma.$TicketMessagePayload, S>

  type TicketMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TicketMessageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TicketMessageCountAggregateInputType | true
    }

  export interface TicketMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TicketMessage'], meta: { name: 'TicketMessage' } }
    /**
     * Find zero or one TicketMessage that matches the filter.
     * @param {TicketMessageFindUniqueArgs} args - Arguments to find a TicketMessage
     * @example
     * // Get one TicketMessage
     * const ticketMessage = await prisma.ticketMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TicketMessageFindUniqueArgs>(args: SelectSubset<T, TicketMessageFindUniqueArgs<ExtArgs>>): Prisma__TicketMessageClient<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TicketMessage that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TicketMessageFindUniqueOrThrowArgs} args - Arguments to find a TicketMessage
     * @example
     * // Get one TicketMessage
     * const ticketMessage = await prisma.ticketMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TicketMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, TicketMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TicketMessageClient<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TicketMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketMessageFindFirstArgs} args - Arguments to find a TicketMessage
     * @example
     * // Get one TicketMessage
     * const ticketMessage = await prisma.ticketMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TicketMessageFindFirstArgs>(args?: SelectSubset<T, TicketMessageFindFirstArgs<ExtArgs>>): Prisma__TicketMessageClient<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TicketMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketMessageFindFirstOrThrowArgs} args - Arguments to find a TicketMessage
     * @example
     * // Get one TicketMessage
     * const ticketMessage = await prisma.ticketMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TicketMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, TicketMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__TicketMessageClient<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TicketMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TicketMessages
     * const ticketMessages = await prisma.ticketMessage.findMany()
     * 
     * // Get first 10 TicketMessages
     * const ticketMessages = await prisma.ticketMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ticketMessageWithIdOnly = await prisma.ticketMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TicketMessageFindManyArgs>(args?: SelectSubset<T, TicketMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TicketMessage.
     * @param {TicketMessageCreateArgs} args - Arguments to create a TicketMessage.
     * @example
     * // Create one TicketMessage
     * const TicketMessage = await prisma.ticketMessage.create({
     *   data: {
     *     // ... data to create a TicketMessage
     *   }
     * })
     * 
     */
    create<T extends TicketMessageCreateArgs>(args: SelectSubset<T, TicketMessageCreateArgs<ExtArgs>>): Prisma__TicketMessageClient<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TicketMessages.
     * @param {TicketMessageCreateManyArgs} args - Arguments to create many TicketMessages.
     * @example
     * // Create many TicketMessages
     * const ticketMessage = await prisma.ticketMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TicketMessageCreateManyArgs>(args?: SelectSubset<T, TicketMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TicketMessages and returns the data saved in the database.
     * @param {TicketMessageCreateManyAndReturnArgs} args - Arguments to create many TicketMessages.
     * @example
     * // Create many TicketMessages
     * const ticketMessage = await prisma.ticketMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TicketMessages and only return the `id`
     * const ticketMessageWithIdOnly = await prisma.ticketMessage.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TicketMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, TicketMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TicketMessage.
     * @param {TicketMessageDeleteArgs} args - Arguments to delete one TicketMessage.
     * @example
     * // Delete one TicketMessage
     * const TicketMessage = await prisma.ticketMessage.delete({
     *   where: {
     *     // ... filter to delete one TicketMessage
     *   }
     * })
     * 
     */
    delete<T extends TicketMessageDeleteArgs>(args: SelectSubset<T, TicketMessageDeleteArgs<ExtArgs>>): Prisma__TicketMessageClient<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TicketMessage.
     * @param {TicketMessageUpdateArgs} args - Arguments to update one TicketMessage.
     * @example
     * // Update one TicketMessage
     * const ticketMessage = await prisma.ticketMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TicketMessageUpdateArgs>(args: SelectSubset<T, TicketMessageUpdateArgs<ExtArgs>>): Prisma__TicketMessageClient<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TicketMessages.
     * @param {TicketMessageDeleteManyArgs} args - Arguments to filter TicketMessages to delete.
     * @example
     * // Delete a few TicketMessages
     * const { count } = await prisma.ticketMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TicketMessageDeleteManyArgs>(args?: SelectSubset<T, TicketMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TicketMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TicketMessages
     * const ticketMessage = await prisma.ticketMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TicketMessageUpdateManyArgs>(args: SelectSubset<T, TicketMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TicketMessage.
     * @param {TicketMessageUpsertArgs} args - Arguments to update or create a TicketMessage.
     * @example
     * // Update or create a TicketMessage
     * const ticketMessage = await prisma.ticketMessage.upsert({
     *   create: {
     *     // ... data to create a TicketMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TicketMessage we want to update
     *   }
     * })
     */
    upsert<T extends TicketMessageUpsertArgs>(args: SelectSubset<T, TicketMessageUpsertArgs<ExtArgs>>): Prisma__TicketMessageClient<$Result.GetResult<Prisma.$TicketMessagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TicketMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketMessageCountArgs} args - Arguments to filter TicketMessages to count.
     * @example
     * // Count the number of TicketMessages
     * const count = await prisma.ticketMessage.count({
     *   where: {
     *     // ... the filter for the TicketMessages we want to count
     *   }
     * })
    **/
    count<T extends TicketMessageCountArgs>(
      args?: Subset<T, TicketMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TicketMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TicketMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TicketMessageAggregateArgs>(args: Subset<T, TicketMessageAggregateArgs>): Prisma.PrismaPromise<GetTicketMessageAggregateType<T>>

    /**
     * Group by TicketMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TicketMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TicketMessageGroupByArgs['orderBy'] }
        : { orderBy?: TicketMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TicketMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTicketMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TicketMessage model
   */
  readonly fields: TicketMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TicketMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TicketMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends TicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TicketDefaultArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    author<T extends TicketingUserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TicketingUserDefaultArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TicketMessage model
   */ 
  interface TicketMessageFieldRefs {
    readonly id: FieldRef<"TicketMessage", 'String'>
    readonly ticketId: FieldRef<"TicketMessage", 'String'>
    readonly authorId: FieldRef<"TicketMessage", 'String'>
    readonly body: FieldRef<"TicketMessage", 'String'>
    readonly isInternal: FieldRef<"TicketMessage", 'Boolean'>
    readonly createdAt: FieldRef<"TicketMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TicketMessage findUnique
   */
  export type TicketMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * Filter, which TicketMessage to fetch.
     */
    where: TicketMessageWhereUniqueInput
  }

  /**
   * TicketMessage findUniqueOrThrow
   */
  export type TicketMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * Filter, which TicketMessage to fetch.
     */
    where: TicketMessageWhereUniqueInput
  }

  /**
   * TicketMessage findFirst
   */
  export type TicketMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * Filter, which TicketMessage to fetch.
     */
    where?: TicketMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketMessages to fetch.
     */
    orderBy?: TicketMessageOrderByWithRelationInput | TicketMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TicketMessages.
     */
    cursor?: TicketMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TicketMessages.
     */
    distinct?: TicketMessageScalarFieldEnum | TicketMessageScalarFieldEnum[]
  }

  /**
   * TicketMessage findFirstOrThrow
   */
  export type TicketMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * Filter, which TicketMessage to fetch.
     */
    where?: TicketMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketMessages to fetch.
     */
    orderBy?: TicketMessageOrderByWithRelationInput | TicketMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TicketMessages.
     */
    cursor?: TicketMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TicketMessages.
     */
    distinct?: TicketMessageScalarFieldEnum | TicketMessageScalarFieldEnum[]
  }

  /**
   * TicketMessage findMany
   */
  export type TicketMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * Filter, which TicketMessages to fetch.
     */
    where?: TicketMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketMessages to fetch.
     */
    orderBy?: TicketMessageOrderByWithRelationInput | TicketMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TicketMessages.
     */
    cursor?: TicketMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketMessages.
     */
    skip?: number
    distinct?: TicketMessageScalarFieldEnum | TicketMessageScalarFieldEnum[]
  }

  /**
   * TicketMessage create
   */
  export type TicketMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a TicketMessage.
     */
    data: XOR<TicketMessageCreateInput, TicketMessageUncheckedCreateInput>
  }

  /**
   * TicketMessage createMany
   */
  export type TicketMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TicketMessages.
     */
    data: TicketMessageCreateManyInput | TicketMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TicketMessage createManyAndReturn
   */
  export type TicketMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TicketMessages.
     */
    data: TicketMessageCreateManyInput | TicketMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TicketMessage update
   */
  export type TicketMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a TicketMessage.
     */
    data: XOR<TicketMessageUpdateInput, TicketMessageUncheckedUpdateInput>
    /**
     * Choose, which TicketMessage to update.
     */
    where: TicketMessageWhereUniqueInput
  }

  /**
   * TicketMessage updateMany
   */
  export type TicketMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TicketMessages.
     */
    data: XOR<TicketMessageUpdateManyMutationInput, TicketMessageUncheckedUpdateManyInput>
    /**
     * Filter which TicketMessages to update
     */
    where?: TicketMessageWhereInput
  }

  /**
   * TicketMessage upsert
   */
  export type TicketMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the TicketMessage to update in case it exists.
     */
    where: TicketMessageWhereUniqueInput
    /**
     * In case the TicketMessage found by the `where` argument doesn't exist, create a new TicketMessage with this data.
     */
    create: XOR<TicketMessageCreateInput, TicketMessageUncheckedCreateInput>
    /**
     * In case the TicketMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TicketMessageUpdateInput, TicketMessageUncheckedUpdateInput>
  }

  /**
   * TicketMessage delete
   */
  export type TicketMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
    /**
     * Filter which TicketMessage to delete.
     */
    where: TicketMessageWhereUniqueInput
  }

  /**
   * TicketMessage deleteMany
   */
  export type TicketMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TicketMessages to delete
     */
    where?: TicketMessageWhereInput
  }

  /**
   * TicketMessage without action
   */
  export type TicketMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketMessage
     */
    select?: TicketMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketMessageInclude<ExtArgs> | null
  }


  /**
   * Model TicketAttachment
   */

  export type AggregateTicketAttachment = {
    _count: TicketAttachmentCountAggregateOutputType | null
    _avg: TicketAttachmentAvgAggregateOutputType | null
    _sum: TicketAttachmentSumAggregateOutputType | null
    _min: TicketAttachmentMinAggregateOutputType | null
    _max: TicketAttachmentMaxAggregateOutputType | null
  }

  export type TicketAttachmentAvgAggregateOutputType = {
    fileSize: number | null
  }

  export type TicketAttachmentSumAggregateOutputType = {
    fileSize: number | null
  }

  export type TicketAttachmentMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    fileName: string | null
    fileUrl: string | null
    fileSize: number | null
    uploadedById: string | null
    createdAt: Date | null
  }

  export type TicketAttachmentMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    fileName: string | null
    fileUrl: string | null
    fileSize: number | null
    uploadedById: string | null
    createdAt: Date | null
  }

  export type TicketAttachmentCountAggregateOutputType = {
    id: number
    ticketId: number
    fileName: number
    fileUrl: number
    fileSize: number
    uploadedById: number
    createdAt: number
    _all: number
  }


  export type TicketAttachmentAvgAggregateInputType = {
    fileSize?: true
  }

  export type TicketAttachmentSumAggregateInputType = {
    fileSize?: true
  }

  export type TicketAttachmentMinAggregateInputType = {
    id?: true
    ticketId?: true
    fileName?: true
    fileUrl?: true
    fileSize?: true
    uploadedById?: true
    createdAt?: true
  }

  export type TicketAttachmentMaxAggregateInputType = {
    id?: true
    ticketId?: true
    fileName?: true
    fileUrl?: true
    fileSize?: true
    uploadedById?: true
    createdAt?: true
  }

  export type TicketAttachmentCountAggregateInputType = {
    id?: true
    ticketId?: true
    fileName?: true
    fileUrl?: true
    fileSize?: true
    uploadedById?: true
    createdAt?: true
    _all?: true
  }

  export type TicketAttachmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TicketAttachment to aggregate.
     */
    where?: TicketAttachmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketAttachments to fetch.
     */
    orderBy?: TicketAttachmentOrderByWithRelationInput | TicketAttachmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TicketAttachmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketAttachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketAttachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TicketAttachments
    **/
    _count?: true | TicketAttachmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TicketAttachmentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TicketAttachmentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TicketAttachmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TicketAttachmentMaxAggregateInputType
  }

  export type GetTicketAttachmentAggregateType<T extends TicketAttachmentAggregateArgs> = {
        [P in keyof T & keyof AggregateTicketAttachment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTicketAttachment[P]>
      : GetScalarType<T[P], AggregateTicketAttachment[P]>
  }




  export type TicketAttachmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketAttachmentWhereInput
    orderBy?: TicketAttachmentOrderByWithAggregationInput | TicketAttachmentOrderByWithAggregationInput[]
    by: TicketAttachmentScalarFieldEnum[] | TicketAttachmentScalarFieldEnum
    having?: TicketAttachmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TicketAttachmentCountAggregateInputType | true
    _avg?: TicketAttachmentAvgAggregateInputType
    _sum?: TicketAttachmentSumAggregateInputType
    _min?: TicketAttachmentMinAggregateInputType
    _max?: TicketAttachmentMaxAggregateInputType
  }

  export type TicketAttachmentGroupByOutputType = {
    id: string
    ticketId: string
    fileName: string
    fileUrl: string
    fileSize: number | null
    uploadedById: string
    createdAt: Date
    _count: TicketAttachmentCountAggregateOutputType | null
    _avg: TicketAttachmentAvgAggregateOutputType | null
    _sum: TicketAttachmentSumAggregateOutputType | null
    _min: TicketAttachmentMinAggregateOutputType | null
    _max: TicketAttachmentMaxAggregateOutputType | null
  }

  type GetTicketAttachmentGroupByPayload<T extends TicketAttachmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TicketAttachmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TicketAttachmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TicketAttachmentGroupByOutputType[P]>
            : GetScalarType<T[P], TicketAttachmentGroupByOutputType[P]>
        }
      >
    >


  export type TicketAttachmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    fileName?: boolean
    fileUrl?: boolean
    fileSize?: boolean
    uploadedById?: boolean
    createdAt?: boolean
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticketAttachment"]>

  export type TicketAttachmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    fileName?: boolean
    fileUrl?: boolean
    fileSize?: boolean
    uploadedById?: boolean
    createdAt?: boolean
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticketAttachment"]>

  export type TicketAttachmentSelectScalar = {
    id?: boolean
    ticketId?: boolean
    fileName?: boolean
    fileUrl?: boolean
    fileSize?: boolean
    uploadedById?: boolean
    createdAt?: boolean
  }

  export type TicketAttachmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
  }
  export type TicketAttachmentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
  }

  export type $TicketAttachmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TicketAttachment"
    objects: {
      ticket: Prisma.$TicketPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      fileName: string
      fileUrl: string
      fileSize: number | null
      uploadedById: string
      createdAt: Date
    }, ExtArgs["result"]["ticketAttachment"]>
    composites: {}
  }

  type TicketAttachmentGetPayload<S extends boolean | null | undefined | TicketAttachmentDefaultArgs> = $Result.GetResult<Prisma.$TicketAttachmentPayload, S>

  type TicketAttachmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TicketAttachmentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TicketAttachmentCountAggregateInputType | true
    }

  export interface TicketAttachmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TicketAttachment'], meta: { name: 'TicketAttachment' } }
    /**
     * Find zero or one TicketAttachment that matches the filter.
     * @param {TicketAttachmentFindUniqueArgs} args - Arguments to find a TicketAttachment
     * @example
     * // Get one TicketAttachment
     * const ticketAttachment = await prisma.ticketAttachment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TicketAttachmentFindUniqueArgs>(args: SelectSubset<T, TicketAttachmentFindUniqueArgs<ExtArgs>>): Prisma__TicketAttachmentClient<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TicketAttachment that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TicketAttachmentFindUniqueOrThrowArgs} args - Arguments to find a TicketAttachment
     * @example
     * // Get one TicketAttachment
     * const ticketAttachment = await prisma.ticketAttachment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TicketAttachmentFindUniqueOrThrowArgs>(args: SelectSubset<T, TicketAttachmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TicketAttachmentClient<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TicketAttachment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAttachmentFindFirstArgs} args - Arguments to find a TicketAttachment
     * @example
     * // Get one TicketAttachment
     * const ticketAttachment = await prisma.ticketAttachment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TicketAttachmentFindFirstArgs>(args?: SelectSubset<T, TicketAttachmentFindFirstArgs<ExtArgs>>): Prisma__TicketAttachmentClient<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TicketAttachment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAttachmentFindFirstOrThrowArgs} args - Arguments to find a TicketAttachment
     * @example
     * // Get one TicketAttachment
     * const ticketAttachment = await prisma.ticketAttachment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TicketAttachmentFindFirstOrThrowArgs>(args?: SelectSubset<T, TicketAttachmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__TicketAttachmentClient<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TicketAttachments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAttachmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TicketAttachments
     * const ticketAttachments = await prisma.ticketAttachment.findMany()
     * 
     * // Get first 10 TicketAttachments
     * const ticketAttachments = await prisma.ticketAttachment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ticketAttachmentWithIdOnly = await prisma.ticketAttachment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TicketAttachmentFindManyArgs>(args?: SelectSubset<T, TicketAttachmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TicketAttachment.
     * @param {TicketAttachmentCreateArgs} args - Arguments to create a TicketAttachment.
     * @example
     * // Create one TicketAttachment
     * const TicketAttachment = await prisma.ticketAttachment.create({
     *   data: {
     *     // ... data to create a TicketAttachment
     *   }
     * })
     * 
     */
    create<T extends TicketAttachmentCreateArgs>(args: SelectSubset<T, TicketAttachmentCreateArgs<ExtArgs>>): Prisma__TicketAttachmentClient<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TicketAttachments.
     * @param {TicketAttachmentCreateManyArgs} args - Arguments to create many TicketAttachments.
     * @example
     * // Create many TicketAttachments
     * const ticketAttachment = await prisma.ticketAttachment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TicketAttachmentCreateManyArgs>(args?: SelectSubset<T, TicketAttachmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TicketAttachments and returns the data saved in the database.
     * @param {TicketAttachmentCreateManyAndReturnArgs} args - Arguments to create many TicketAttachments.
     * @example
     * // Create many TicketAttachments
     * const ticketAttachment = await prisma.ticketAttachment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TicketAttachments and only return the `id`
     * const ticketAttachmentWithIdOnly = await prisma.ticketAttachment.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TicketAttachmentCreateManyAndReturnArgs>(args?: SelectSubset<T, TicketAttachmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TicketAttachment.
     * @param {TicketAttachmentDeleteArgs} args - Arguments to delete one TicketAttachment.
     * @example
     * // Delete one TicketAttachment
     * const TicketAttachment = await prisma.ticketAttachment.delete({
     *   where: {
     *     // ... filter to delete one TicketAttachment
     *   }
     * })
     * 
     */
    delete<T extends TicketAttachmentDeleteArgs>(args: SelectSubset<T, TicketAttachmentDeleteArgs<ExtArgs>>): Prisma__TicketAttachmentClient<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TicketAttachment.
     * @param {TicketAttachmentUpdateArgs} args - Arguments to update one TicketAttachment.
     * @example
     * // Update one TicketAttachment
     * const ticketAttachment = await prisma.ticketAttachment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TicketAttachmentUpdateArgs>(args: SelectSubset<T, TicketAttachmentUpdateArgs<ExtArgs>>): Prisma__TicketAttachmentClient<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TicketAttachments.
     * @param {TicketAttachmentDeleteManyArgs} args - Arguments to filter TicketAttachments to delete.
     * @example
     * // Delete a few TicketAttachments
     * const { count } = await prisma.ticketAttachment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TicketAttachmentDeleteManyArgs>(args?: SelectSubset<T, TicketAttachmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TicketAttachments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAttachmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TicketAttachments
     * const ticketAttachment = await prisma.ticketAttachment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TicketAttachmentUpdateManyArgs>(args: SelectSubset<T, TicketAttachmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TicketAttachment.
     * @param {TicketAttachmentUpsertArgs} args - Arguments to update or create a TicketAttachment.
     * @example
     * // Update or create a TicketAttachment
     * const ticketAttachment = await prisma.ticketAttachment.upsert({
     *   create: {
     *     // ... data to create a TicketAttachment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TicketAttachment we want to update
     *   }
     * })
     */
    upsert<T extends TicketAttachmentUpsertArgs>(args: SelectSubset<T, TicketAttachmentUpsertArgs<ExtArgs>>): Prisma__TicketAttachmentClient<$Result.GetResult<Prisma.$TicketAttachmentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TicketAttachments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAttachmentCountArgs} args - Arguments to filter TicketAttachments to count.
     * @example
     * // Count the number of TicketAttachments
     * const count = await prisma.ticketAttachment.count({
     *   where: {
     *     // ... the filter for the TicketAttachments we want to count
     *   }
     * })
    **/
    count<T extends TicketAttachmentCountArgs>(
      args?: Subset<T, TicketAttachmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TicketAttachmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TicketAttachment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAttachmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TicketAttachmentAggregateArgs>(args: Subset<T, TicketAttachmentAggregateArgs>): Prisma.PrismaPromise<GetTicketAttachmentAggregateType<T>>

    /**
     * Group by TicketAttachment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAttachmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TicketAttachmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TicketAttachmentGroupByArgs['orderBy'] }
        : { orderBy?: TicketAttachmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TicketAttachmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTicketAttachmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TicketAttachment model
   */
  readonly fields: TicketAttachmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TicketAttachment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TicketAttachmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends TicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TicketDefaultArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TicketAttachment model
   */ 
  interface TicketAttachmentFieldRefs {
    readonly id: FieldRef<"TicketAttachment", 'String'>
    readonly ticketId: FieldRef<"TicketAttachment", 'String'>
    readonly fileName: FieldRef<"TicketAttachment", 'String'>
    readonly fileUrl: FieldRef<"TicketAttachment", 'String'>
    readonly fileSize: FieldRef<"TicketAttachment", 'Int'>
    readonly uploadedById: FieldRef<"TicketAttachment", 'String'>
    readonly createdAt: FieldRef<"TicketAttachment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TicketAttachment findUnique
   */
  export type TicketAttachmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * Filter, which TicketAttachment to fetch.
     */
    where: TicketAttachmentWhereUniqueInput
  }

  /**
   * TicketAttachment findUniqueOrThrow
   */
  export type TicketAttachmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * Filter, which TicketAttachment to fetch.
     */
    where: TicketAttachmentWhereUniqueInput
  }

  /**
   * TicketAttachment findFirst
   */
  export type TicketAttachmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * Filter, which TicketAttachment to fetch.
     */
    where?: TicketAttachmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketAttachments to fetch.
     */
    orderBy?: TicketAttachmentOrderByWithRelationInput | TicketAttachmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TicketAttachments.
     */
    cursor?: TicketAttachmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketAttachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketAttachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TicketAttachments.
     */
    distinct?: TicketAttachmentScalarFieldEnum | TicketAttachmentScalarFieldEnum[]
  }

  /**
   * TicketAttachment findFirstOrThrow
   */
  export type TicketAttachmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * Filter, which TicketAttachment to fetch.
     */
    where?: TicketAttachmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketAttachments to fetch.
     */
    orderBy?: TicketAttachmentOrderByWithRelationInput | TicketAttachmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TicketAttachments.
     */
    cursor?: TicketAttachmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketAttachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketAttachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TicketAttachments.
     */
    distinct?: TicketAttachmentScalarFieldEnum | TicketAttachmentScalarFieldEnum[]
  }

  /**
   * TicketAttachment findMany
   */
  export type TicketAttachmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * Filter, which TicketAttachments to fetch.
     */
    where?: TicketAttachmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketAttachments to fetch.
     */
    orderBy?: TicketAttachmentOrderByWithRelationInput | TicketAttachmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TicketAttachments.
     */
    cursor?: TicketAttachmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketAttachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketAttachments.
     */
    skip?: number
    distinct?: TicketAttachmentScalarFieldEnum | TicketAttachmentScalarFieldEnum[]
  }

  /**
   * TicketAttachment create
   */
  export type TicketAttachmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * The data needed to create a TicketAttachment.
     */
    data: XOR<TicketAttachmentCreateInput, TicketAttachmentUncheckedCreateInput>
  }

  /**
   * TicketAttachment createMany
   */
  export type TicketAttachmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TicketAttachments.
     */
    data: TicketAttachmentCreateManyInput | TicketAttachmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TicketAttachment createManyAndReturn
   */
  export type TicketAttachmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TicketAttachments.
     */
    data: TicketAttachmentCreateManyInput | TicketAttachmentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TicketAttachment update
   */
  export type TicketAttachmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * The data needed to update a TicketAttachment.
     */
    data: XOR<TicketAttachmentUpdateInput, TicketAttachmentUncheckedUpdateInput>
    /**
     * Choose, which TicketAttachment to update.
     */
    where: TicketAttachmentWhereUniqueInput
  }

  /**
   * TicketAttachment updateMany
   */
  export type TicketAttachmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TicketAttachments.
     */
    data: XOR<TicketAttachmentUpdateManyMutationInput, TicketAttachmentUncheckedUpdateManyInput>
    /**
     * Filter which TicketAttachments to update
     */
    where?: TicketAttachmentWhereInput
  }

  /**
   * TicketAttachment upsert
   */
  export type TicketAttachmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * The filter to search for the TicketAttachment to update in case it exists.
     */
    where: TicketAttachmentWhereUniqueInput
    /**
     * In case the TicketAttachment found by the `where` argument doesn't exist, create a new TicketAttachment with this data.
     */
    create: XOR<TicketAttachmentCreateInput, TicketAttachmentUncheckedCreateInput>
    /**
     * In case the TicketAttachment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TicketAttachmentUpdateInput, TicketAttachmentUncheckedUpdateInput>
  }

  /**
   * TicketAttachment delete
   */
  export type TicketAttachmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
    /**
     * Filter which TicketAttachment to delete.
     */
    where: TicketAttachmentWhereUniqueInput
  }

  /**
   * TicketAttachment deleteMany
   */
  export type TicketAttachmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TicketAttachments to delete
     */
    where?: TicketAttachmentWhereInput
  }

  /**
   * TicketAttachment without action
   */
  export type TicketAttachmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAttachment
     */
    select?: TicketAttachmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAttachmentInclude<ExtArgs> | null
  }


  /**
   * Model TicketAuditLog
   */

  export type AggregateTicketAuditLog = {
    _count: TicketAuditLogCountAggregateOutputType | null
    _min: TicketAuditLogMinAggregateOutputType | null
    _max: TicketAuditLogMaxAggregateOutputType | null
  }

  export type TicketAuditLogMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    actorId: string | null
    action: string | null
    field: string | null
    oldValue: string | null
    newValue: string | null
    createdAt: Date | null
  }

  export type TicketAuditLogMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    actorId: string | null
    action: string | null
    field: string | null
    oldValue: string | null
    newValue: string | null
    createdAt: Date | null
  }

  export type TicketAuditLogCountAggregateOutputType = {
    id: number
    ticketId: number
    actorId: number
    action: number
    field: number
    oldValue: number
    newValue: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type TicketAuditLogMinAggregateInputType = {
    id?: true
    ticketId?: true
    actorId?: true
    action?: true
    field?: true
    oldValue?: true
    newValue?: true
    createdAt?: true
  }

  export type TicketAuditLogMaxAggregateInputType = {
    id?: true
    ticketId?: true
    actorId?: true
    action?: true
    field?: true
    oldValue?: true
    newValue?: true
    createdAt?: true
  }

  export type TicketAuditLogCountAggregateInputType = {
    id?: true
    ticketId?: true
    actorId?: true
    action?: true
    field?: true
    oldValue?: true
    newValue?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type TicketAuditLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TicketAuditLog to aggregate.
     */
    where?: TicketAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketAuditLogs to fetch.
     */
    orderBy?: TicketAuditLogOrderByWithRelationInput | TicketAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TicketAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TicketAuditLogs
    **/
    _count?: true | TicketAuditLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TicketAuditLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TicketAuditLogMaxAggregateInputType
  }

  export type GetTicketAuditLogAggregateType<T extends TicketAuditLogAggregateArgs> = {
        [P in keyof T & keyof AggregateTicketAuditLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTicketAuditLog[P]>
      : GetScalarType<T[P], AggregateTicketAuditLog[P]>
  }




  export type TicketAuditLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketAuditLogWhereInput
    orderBy?: TicketAuditLogOrderByWithAggregationInput | TicketAuditLogOrderByWithAggregationInput[]
    by: TicketAuditLogScalarFieldEnum[] | TicketAuditLogScalarFieldEnum
    having?: TicketAuditLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TicketAuditLogCountAggregateInputType | true
    _min?: TicketAuditLogMinAggregateInputType
    _max?: TicketAuditLogMaxAggregateInputType
  }

  export type TicketAuditLogGroupByOutputType = {
    id: string
    ticketId: string
    actorId: string | null
    action: string
    field: string | null
    oldValue: string | null
    newValue: string | null
    metadata: JsonValue | null
    createdAt: Date
    _count: TicketAuditLogCountAggregateOutputType | null
    _min: TicketAuditLogMinAggregateOutputType | null
    _max: TicketAuditLogMaxAggregateOutputType | null
  }

  type GetTicketAuditLogGroupByPayload<T extends TicketAuditLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TicketAuditLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TicketAuditLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TicketAuditLogGroupByOutputType[P]>
            : GetScalarType<T[P], TicketAuditLogGroupByOutputType[P]>
        }
      >
    >


  export type TicketAuditLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    actorId?: boolean
    action?: boolean
    field?: boolean
    oldValue?: boolean
    newValue?: boolean
    metadata?: boolean
    createdAt?: boolean
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    actor?: boolean | TicketAuditLog$actorArgs<ExtArgs>
  }, ExtArgs["result"]["ticketAuditLog"]>

  export type TicketAuditLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    actorId?: boolean
    action?: boolean
    field?: boolean
    oldValue?: boolean
    newValue?: boolean
    metadata?: boolean
    createdAt?: boolean
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    actor?: boolean | TicketAuditLog$actorArgs<ExtArgs>
  }, ExtArgs["result"]["ticketAuditLog"]>

  export type TicketAuditLogSelectScalar = {
    id?: boolean
    ticketId?: boolean
    actorId?: boolean
    action?: boolean
    field?: boolean
    oldValue?: boolean
    newValue?: boolean
    metadata?: boolean
    createdAt?: boolean
  }

  export type TicketAuditLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    actor?: boolean | TicketAuditLog$actorArgs<ExtArgs>
  }
  export type TicketAuditLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    actor?: boolean | TicketAuditLog$actorArgs<ExtArgs>
  }

  export type $TicketAuditLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TicketAuditLog"
    objects: {
      ticket: Prisma.$TicketPayload<ExtArgs>
      actor: Prisma.$TicketingUserPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      actorId: string | null
      action: string
      field: string | null
      oldValue: string | null
      newValue: string | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["ticketAuditLog"]>
    composites: {}
  }

  type TicketAuditLogGetPayload<S extends boolean | null | undefined | TicketAuditLogDefaultArgs> = $Result.GetResult<Prisma.$TicketAuditLogPayload, S>

  type TicketAuditLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TicketAuditLogFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TicketAuditLogCountAggregateInputType | true
    }

  export interface TicketAuditLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TicketAuditLog'], meta: { name: 'TicketAuditLog' } }
    /**
     * Find zero or one TicketAuditLog that matches the filter.
     * @param {TicketAuditLogFindUniqueArgs} args - Arguments to find a TicketAuditLog
     * @example
     * // Get one TicketAuditLog
     * const ticketAuditLog = await prisma.ticketAuditLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TicketAuditLogFindUniqueArgs>(args: SelectSubset<T, TicketAuditLogFindUniqueArgs<ExtArgs>>): Prisma__TicketAuditLogClient<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TicketAuditLog that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TicketAuditLogFindUniqueOrThrowArgs} args - Arguments to find a TicketAuditLog
     * @example
     * // Get one TicketAuditLog
     * const ticketAuditLog = await prisma.ticketAuditLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TicketAuditLogFindUniqueOrThrowArgs>(args: SelectSubset<T, TicketAuditLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TicketAuditLogClient<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TicketAuditLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAuditLogFindFirstArgs} args - Arguments to find a TicketAuditLog
     * @example
     * // Get one TicketAuditLog
     * const ticketAuditLog = await prisma.ticketAuditLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TicketAuditLogFindFirstArgs>(args?: SelectSubset<T, TicketAuditLogFindFirstArgs<ExtArgs>>): Prisma__TicketAuditLogClient<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TicketAuditLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAuditLogFindFirstOrThrowArgs} args - Arguments to find a TicketAuditLog
     * @example
     * // Get one TicketAuditLog
     * const ticketAuditLog = await prisma.ticketAuditLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TicketAuditLogFindFirstOrThrowArgs>(args?: SelectSubset<T, TicketAuditLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__TicketAuditLogClient<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TicketAuditLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAuditLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TicketAuditLogs
     * const ticketAuditLogs = await prisma.ticketAuditLog.findMany()
     * 
     * // Get first 10 TicketAuditLogs
     * const ticketAuditLogs = await prisma.ticketAuditLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ticketAuditLogWithIdOnly = await prisma.ticketAuditLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TicketAuditLogFindManyArgs>(args?: SelectSubset<T, TicketAuditLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TicketAuditLog.
     * @param {TicketAuditLogCreateArgs} args - Arguments to create a TicketAuditLog.
     * @example
     * // Create one TicketAuditLog
     * const TicketAuditLog = await prisma.ticketAuditLog.create({
     *   data: {
     *     // ... data to create a TicketAuditLog
     *   }
     * })
     * 
     */
    create<T extends TicketAuditLogCreateArgs>(args: SelectSubset<T, TicketAuditLogCreateArgs<ExtArgs>>): Prisma__TicketAuditLogClient<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TicketAuditLogs.
     * @param {TicketAuditLogCreateManyArgs} args - Arguments to create many TicketAuditLogs.
     * @example
     * // Create many TicketAuditLogs
     * const ticketAuditLog = await prisma.ticketAuditLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TicketAuditLogCreateManyArgs>(args?: SelectSubset<T, TicketAuditLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TicketAuditLogs and returns the data saved in the database.
     * @param {TicketAuditLogCreateManyAndReturnArgs} args - Arguments to create many TicketAuditLogs.
     * @example
     * // Create many TicketAuditLogs
     * const ticketAuditLog = await prisma.ticketAuditLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TicketAuditLogs and only return the `id`
     * const ticketAuditLogWithIdOnly = await prisma.ticketAuditLog.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TicketAuditLogCreateManyAndReturnArgs>(args?: SelectSubset<T, TicketAuditLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TicketAuditLog.
     * @param {TicketAuditLogDeleteArgs} args - Arguments to delete one TicketAuditLog.
     * @example
     * // Delete one TicketAuditLog
     * const TicketAuditLog = await prisma.ticketAuditLog.delete({
     *   where: {
     *     // ... filter to delete one TicketAuditLog
     *   }
     * })
     * 
     */
    delete<T extends TicketAuditLogDeleteArgs>(args: SelectSubset<T, TicketAuditLogDeleteArgs<ExtArgs>>): Prisma__TicketAuditLogClient<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TicketAuditLog.
     * @param {TicketAuditLogUpdateArgs} args - Arguments to update one TicketAuditLog.
     * @example
     * // Update one TicketAuditLog
     * const ticketAuditLog = await prisma.ticketAuditLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TicketAuditLogUpdateArgs>(args: SelectSubset<T, TicketAuditLogUpdateArgs<ExtArgs>>): Prisma__TicketAuditLogClient<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TicketAuditLogs.
     * @param {TicketAuditLogDeleteManyArgs} args - Arguments to filter TicketAuditLogs to delete.
     * @example
     * // Delete a few TicketAuditLogs
     * const { count } = await prisma.ticketAuditLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TicketAuditLogDeleteManyArgs>(args?: SelectSubset<T, TicketAuditLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TicketAuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAuditLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TicketAuditLogs
     * const ticketAuditLog = await prisma.ticketAuditLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TicketAuditLogUpdateManyArgs>(args: SelectSubset<T, TicketAuditLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TicketAuditLog.
     * @param {TicketAuditLogUpsertArgs} args - Arguments to update or create a TicketAuditLog.
     * @example
     * // Update or create a TicketAuditLog
     * const ticketAuditLog = await prisma.ticketAuditLog.upsert({
     *   create: {
     *     // ... data to create a TicketAuditLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TicketAuditLog we want to update
     *   }
     * })
     */
    upsert<T extends TicketAuditLogUpsertArgs>(args: SelectSubset<T, TicketAuditLogUpsertArgs<ExtArgs>>): Prisma__TicketAuditLogClient<$Result.GetResult<Prisma.$TicketAuditLogPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TicketAuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAuditLogCountArgs} args - Arguments to filter TicketAuditLogs to count.
     * @example
     * // Count the number of TicketAuditLogs
     * const count = await prisma.ticketAuditLog.count({
     *   where: {
     *     // ... the filter for the TicketAuditLogs we want to count
     *   }
     * })
    **/
    count<T extends TicketAuditLogCountArgs>(
      args?: Subset<T, TicketAuditLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TicketAuditLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TicketAuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAuditLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TicketAuditLogAggregateArgs>(args: Subset<T, TicketAuditLogAggregateArgs>): Prisma.PrismaPromise<GetTicketAuditLogAggregateType<T>>

    /**
     * Group by TicketAuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAuditLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TicketAuditLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TicketAuditLogGroupByArgs['orderBy'] }
        : { orderBy?: TicketAuditLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TicketAuditLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTicketAuditLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TicketAuditLog model
   */
  readonly fields: TicketAuditLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TicketAuditLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TicketAuditLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends TicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TicketDefaultArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    actor<T extends TicketAuditLog$actorArgs<ExtArgs> = {}>(args?: Subset<T, TicketAuditLog$actorArgs<ExtArgs>>): Prisma__TicketingUserClient<$Result.GetResult<Prisma.$TicketingUserPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TicketAuditLog model
   */ 
  interface TicketAuditLogFieldRefs {
    readonly id: FieldRef<"TicketAuditLog", 'String'>
    readonly ticketId: FieldRef<"TicketAuditLog", 'String'>
    readonly actorId: FieldRef<"TicketAuditLog", 'String'>
    readonly action: FieldRef<"TicketAuditLog", 'String'>
    readonly field: FieldRef<"TicketAuditLog", 'String'>
    readonly oldValue: FieldRef<"TicketAuditLog", 'String'>
    readonly newValue: FieldRef<"TicketAuditLog", 'String'>
    readonly metadata: FieldRef<"TicketAuditLog", 'Json'>
    readonly createdAt: FieldRef<"TicketAuditLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TicketAuditLog findUnique
   */
  export type TicketAuditLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * Filter, which TicketAuditLog to fetch.
     */
    where: TicketAuditLogWhereUniqueInput
  }

  /**
   * TicketAuditLog findUniqueOrThrow
   */
  export type TicketAuditLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * Filter, which TicketAuditLog to fetch.
     */
    where: TicketAuditLogWhereUniqueInput
  }

  /**
   * TicketAuditLog findFirst
   */
  export type TicketAuditLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * Filter, which TicketAuditLog to fetch.
     */
    where?: TicketAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketAuditLogs to fetch.
     */
    orderBy?: TicketAuditLogOrderByWithRelationInput | TicketAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TicketAuditLogs.
     */
    cursor?: TicketAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TicketAuditLogs.
     */
    distinct?: TicketAuditLogScalarFieldEnum | TicketAuditLogScalarFieldEnum[]
  }

  /**
   * TicketAuditLog findFirstOrThrow
   */
  export type TicketAuditLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * Filter, which TicketAuditLog to fetch.
     */
    where?: TicketAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketAuditLogs to fetch.
     */
    orderBy?: TicketAuditLogOrderByWithRelationInput | TicketAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TicketAuditLogs.
     */
    cursor?: TicketAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TicketAuditLogs.
     */
    distinct?: TicketAuditLogScalarFieldEnum | TicketAuditLogScalarFieldEnum[]
  }

  /**
   * TicketAuditLog findMany
   */
  export type TicketAuditLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * Filter, which TicketAuditLogs to fetch.
     */
    where?: TicketAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TicketAuditLogs to fetch.
     */
    orderBy?: TicketAuditLogOrderByWithRelationInput | TicketAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TicketAuditLogs.
     */
    cursor?: TicketAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TicketAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TicketAuditLogs.
     */
    skip?: number
    distinct?: TicketAuditLogScalarFieldEnum | TicketAuditLogScalarFieldEnum[]
  }

  /**
   * TicketAuditLog create
   */
  export type TicketAuditLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * The data needed to create a TicketAuditLog.
     */
    data: XOR<TicketAuditLogCreateInput, TicketAuditLogUncheckedCreateInput>
  }

  /**
   * TicketAuditLog createMany
   */
  export type TicketAuditLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TicketAuditLogs.
     */
    data: TicketAuditLogCreateManyInput | TicketAuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TicketAuditLog createManyAndReturn
   */
  export type TicketAuditLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TicketAuditLogs.
     */
    data: TicketAuditLogCreateManyInput | TicketAuditLogCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TicketAuditLog update
   */
  export type TicketAuditLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * The data needed to update a TicketAuditLog.
     */
    data: XOR<TicketAuditLogUpdateInput, TicketAuditLogUncheckedUpdateInput>
    /**
     * Choose, which TicketAuditLog to update.
     */
    where: TicketAuditLogWhereUniqueInput
  }

  /**
   * TicketAuditLog updateMany
   */
  export type TicketAuditLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TicketAuditLogs.
     */
    data: XOR<TicketAuditLogUpdateManyMutationInput, TicketAuditLogUncheckedUpdateManyInput>
    /**
     * Filter which TicketAuditLogs to update
     */
    where?: TicketAuditLogWhereInput
  }

  /**
   * TicketAuditLog upsert
   */
  export type TicketAuditLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * The filter to search for the TicketAuditLog to update in case it exists.
     */
    where: TicketAuditLogWhereUniqueInput
    /**
     * In case the TicketAuditLog found by the `where` argument doesn't exist, create a new TicketAuditLog with this data.
     */
    create: XOR<TicketAuditLogCreateInput, TicketAuditLogUncheckedCreateInput>
    /**
     * In case the TicketAuditLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TicketAuditLogUpdateInput, TicketAuditLogUncheckedUpdateInput>
  }

  /**
   * TicketAuditLog delete
   */
  export type TicketAuditLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
    /**
     * Filter which TicketAuditLog to delete.
     */
    where: TicketAuditLogWhereUniqueInput
  }

  /**
   * TicketAuditLog deleteMany
   */
  export type TicketAuditLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TicketAuditLogs to delete
     */
    where?: TicketAuditLogWhereInput
  }

  /**
   * TicketAuditLog.actor
   */
  export type TicketAuditLog$actorArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketingUser
     */
    select?: TicketingUserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketingUserInclude<ExtArgs> | null
    where?: TicketingUserWhereInput
  }

  /**
   * TicketAuditLog without action
   */
  export type TicketAuditLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketAuditLog
     */
    select?: TicketAuditLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketAuditLogInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const OrganizationScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    active: 'active',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type OrganizationScalarFieldEnum = (typeof OrganizationScalarFieldEnum)[keyof typeof OrganizationScalarFieldEnum]


  export const TicketingUserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    name: 'name',
    role: 'role',
    organizationId: 'organizationId',
    consultantVerified: 'consultantVerified',
    tbosAdminUserId: 'tbosAdminUserId',
    tbosRole: 'tbosRole',
    active: 'active',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TicketingUserScalarFieldEnum = (typeof TicketingUserScalarFieldEnum)[keyof typeof TicketingUserScalarFieldEnum]


  export const ConsultantOrganizationScalarFieldEnum: {
    id: 'id',
    consultantId: 'consultantId',
    organizationId: 'organizationId',
    createdAt: 'createdAt'
  };

  export type ConsultantOrganizationScalarFieldEnum = (typeof ConsultantOrganizationScalarFieldEnum)[keyof typeof ConsultantOrganizationScalarFieldEnum]


  export const TicketScalarFieldEnum: {
    id: 'id',
    ticketNumber: 'ticketNumber',
    organizationId: 'organizationId',
    type: 'type',
    priority: 'priority',
    status: 'status',
    subject: 'subject',
    description: 'description',
    createdById: 'createdById',
    assignedToId: 'assignedToId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    closedAt: 'closedAt'
  };

  export type TicketScalarFieldEnum = (typeof TicketScalarFieldEnum)[keyof typeof TicketScalarFieldEnum]


  export const TicketMessageScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    authorId: 'authorId',
    body: 'body',
    isInternal: 'isInternal',
    createdAt: 'createdAt'
  };

  export type TicketMessageScalarFieldEnum = (typeof TicketMessageScalarFieldEnum)[keyof typeof TicketMessageScalarFieldEnum]


  export const TicketAttachmentScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    fileName: 'fileName',
    fileUrl: 'fileUrl',
    fileSize: 'fileSize',
    uploadedById: 'uploadedById',
    createdAt: 'createdAt'
  };

  export type TicketAttachmentScalarFieldEnum = (typeof TicketAttachmentScalarFieldEnum)[keyof typeof TicketAttachmentScalarFieldEnum]


  export const TicketAuditLogScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    actorId: 'actorId',
    action: 'action',
    field: 'field',
    oldValue: 'oldValue',
    newValue: 'newValue',
    metadata: 'metadata',
    createdAt: 'createdAt'
  };

  export type TicketAuditLogScalarFieldEnum = (typeof TicketAuditLogScalarFieldEnum)[keyof typeof TicketAuditLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'TicketingUserRole'
   */
  export type EnumTicketingUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketingUserRole'>
    


  /**
   * Reference to a field of type 'TicketingUserRole[]'
   */
  export type ListEnumTicketingUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketingUserRole[]'>
    


  /**
   * Reference to a field of type 'TicketType'
   */
  export type EnumTicketTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketType'>
    


  /**
   * Reference to a field of type 'TicketType[]'
   */
  export type ListEnumTicketTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketType[]'>
    


  /**
   * Reference to a field of type 'TicketPriority'
   */
  export type EnumTicketPriorityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketPriority'>
    


  /**
   * Reference to a field of type 'TicketPriority[]'
   */
  export type ListEnumTicketPriorityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketPriority[]'>
    


  /**
   * Reference to a field of type 'TicketStatus'
   */
  export type EnumTicketStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketStatus'>
    


  /**
   * Reference to a field of type 'TicketStatus[]'
   */
  export type ListEnumTicketStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type OrganizationWhereInput = {
    AND?: OrganizationWhereInput | OrganizationWhereInput[]
    OR?: OrganizationWhereInput[]
    NOT?: OrganizationWhereInput | OrganizationWhereInput[]
    id?: StringFilter<"Organization"> | string
    name?: StringFilter<"Organization"> | string
    slug?: StringFilter<"Organization"> | string
    active?: BoolFilter<"Organization"> | boolean
    createdAt?: DateTimeFilter<"Organization"> | Date | string
    updatedAt?: DateTimeFilter<"Organization"> | Date | string
    users?: TicketingUserListRelationFilter
    tickets?: TicketListRelationFilter
    consultantOrganizations?: ConsultantOrganizationListRelationFilter
  }

  export type OrganizationOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    users?: TicketingUserOrderByRelationAggregateInput
    tickets?: TicketOrderByRelationAggregateInput
    consultantOrganizations?: ConsultantOrganizationOrderByRelationAggregateInput
  }

  export type OrganizationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: OrganizationWhereInput | OrganizationWhereInput[]
    OR?: OrganizationWhereInput[]
    NOT?: OrganizationWhereInput | OrganizationWhereInput[]
    name?: StringFilter<"Organization"> | string
    active?: BoolFilter<"Organization"> | boolean
    createdAt?: DateTimeFilter<"Organization"> | Date | string
    updatedAt?: DateTimeFilter<"Organization"> | Date | string
    users?: TicketingUserListRelationFilter
    tickets?: TicketListRelationFilter
    consultantOrganizations?: ConsultantOrganizationListRelationFilter
  }, "id" | "slug">

  export type OrganizationOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: OrganizationCountOrderByAggregateInput
    _max?: OrganizationMaxOrderByAggregateInput
    _min?: OrganizationMinOrderByAggregateInput
  }

  export type OrganizationScalarWhereWithAggregatesInput = {
    AND?: OrganizationScalarWhereWithAggregatesInput | OrganizationScalarWhereWithAggregatesInput[]
    OR?: OrganizationScalarWhereWithAggregatesInput[]
    NOT?: OrganizationScalarWhereWithAggregatesInput | OrganizationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Organization"> | string
    name?: StringWithAggregatesFilter<"Organization"> | string
    slug?: StringWithAggregatesFilter<"Organization"> | string
    active?: BoolWithAggregatesFilter<"Organization"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Organization"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Organization"> | Date | string
  }

  export type TicketingUserWhereInput = {
    AND?: TicketingUserWhereInput | TicketingUserWhereInput[]
    OR?: TicketingUserWhereInput[]
    NOT?: TicketingUserWhereInput | TicketingUserWhereInput[]
    id?: StringFilter<"TicketingUser"> | string
    email?: StringFilter<"TicketingUser"> | string
    passwordHash?: StringFilter<"TicketingUser"> | string
    name?: StringFilter<"TicketingUser"> | string
    role?: EnumTicketingUserRoleFilter<"TicketingUser"> | $Enums.TicketingUserRole
    organizationId?: StringNullableFilter<"TicketingUser"> | string | null
    consultantVerified?: BoolFilter<"TicketingUser"> | boolean
    tbosAdminUserId?: StringNullableFilter<"TicketingUser"> | string | null
    tbosRole?: StringNullableFilter<"TicketingUser"> | string | null
    active?: BoolFilter<"TicketingUser"> | boolean
    createdAt?: DateTimeFilter<"TicketingUser"> | Date | string
    updatedAt?: DateTimeFilter<"TicketingUser"> | Date | string
    organization?: XOR<OrganizationNullableRelationFilter, OrganizationWhereInput> | null
    createdTickets?: TicketListRelationFilter
    assignedTickets?: TicketListRelationFilter
    messages?: TicketMessageListRelationFilter
    auditLogs?: TicketAuditLogListRelationFilter
    consultantOrganizations?: ConsultantOrganizationListRelationFilter
  }

  export type TicketingUserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    consultantVerified?: SortOrder
    tbosAdminUserId?: SortOrderInput | SortOrder
    tbosRole?: SortOrderInput | SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    organization?: OrganizationOrderByWithRelationInput
    createdTickets?: TicketOrderByRelationAggregateInput
    assignedTickets?: TicketOrderByRelationAggregateInput
    messages?: TicketMessageOrderByRelationAggregateInput
    auditLogs?: TicketAuditLogOrderByRelationAggregateInput
    consultantOrganizations?: ConsultantOrganizationOrderByRelationAggregateInput
  }

  export type TicketingUserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    tbosAdminUserId?: string
    AND?: TicketingUserWhereInput | TicketingUserWhereInput[]
    OR?: TicketingUserWhereInput[]
    NOT?: TicketingUserWhereInput | TicketingUserWhereInput[]
    passwordHash?: StringFilter<"TicketingUser"> | string
    name?: StringFilter<"TicketingUser"> | string
    role?: EnumTicketingUserRoleFilter<"TicketingUser"> | $Enums.TicketingUserRole
    organizationId?: StringNullableFilter<"TicketingUser"> | string | null
    consultantVerified?: BoolFilter<"TicketingUser"> | boolean
    tbosRole?: StringNullableFilter<"TicketingUser"> | string | null
    active?: BoolFilter<"TicketingUser"> | boolean
    createdAt?: DateTimeFilter<"TicketingUser"> | Date | string
    updatedAt?: DateTimeFilter<"TicketingUser"> | Date | string
    organization?: XOR<OrganizationNullableRelationFilter, OrganizationWhereInput> | null
    createdTickets?: TicketListRelationFilter
    assignedTickets?: TicketListRelationFilter
    messages?: TicketMessageListRelationFilter
    auditLogs?: TicketAuditLogListRelationFilter
    consultantOrganizations?: ConsultantOrganizationListRelationFilter
  }, "id" | "email" | "tbosAdminUserId">

  export type TicketingUserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    consultantVerified?: SortOrder
    tbosAdminUserId?: SortOrderInput | SortOrder
    tbosRole?: SortOrderInput | SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TicketingUserCountOrderByAggregateInput
    _max?: TicketingUserMaxOrderByAggregateInput
    _min?: TicketingUserMinOrderByAggregateInput
  }

  export type TicketingUserScalarWhereWithAggregatesInput = {
    AND?: TicketingUserScalarWhereWithAggregatesInput | TicketingUserScalarWhereWithAggregatesInput[]
    OR?: TicketingUserScalarWhereWithAggregatesInput[]
    NOT?: TicketingUserScalarWhereWithAggregatesInput | TicketingUserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TicketingUser"> | string
    email?: StringWithAggregatesFilter<"TicketingUser"> | string
    passwordHash?: StringWithAggregatesFilter<"TicketingUser"> | string
    name?: StringWithAggregatesFilter<"TicketingUser"> | string
    role?: EnumTicketingUserRoleWithAggregatesFilter<"TicketingUser"> | $Enums.TicketingUserRole
    organizationId?: StringNullableWithAggregatesFilter<"TicketingUser"> | string | null
    consultantVerified?: BoolWithAggregatesFilter<"TicketingUser"> | boolean
    tbosAdminUserId?: StringNullableWithAggregatesFilter<"TicketingUser"> | string | null
    tbosRole?: StringNullableWithAggregatesFilter<"TicketingUser"> | string | null
    active?: BoolWithAggregatesFilter<"TicketingUser"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"TicketingUser"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TicketingUser"> | Date | string
  }

  export type ConsultantOrganizationWhereInput = {
    AND?: ConsultantOrganizationWhereInput | ConsultantOrganizationWhereInput[]
    OR?: ConsultantOrganizationWhereInput[]
    NOT?: ConsultantOrganizationWhereInput | ConsultantOrganizationWhereInput[]
    id?: StringFilter<"ConsultantOrganization"> | string
    consultantId?: StringFilter<"ConsultantOrganization"> | string
    organizationId?: StringFilter<"ConsultantOrganization"> | string
    createdAt?: DateTimeFilter<"ConsultantOrganization"> | Date | string
    consultant?: XOR<TicketingUserRelationFilter, TicketingUserWhereInput>
    organization?: XOR<OrganizationRelationFilter, OrganizationWhereInput>
  }

  export type ConsultantOrganizationOrderByWithRelationInput = {
    id?: SortOrder
    consultantId?: SortOrder
    organizationId?: SortOrder
    createdAt?: SortOrder
    consultant?: TicketingUserOrderByWithRelationInput
    organization?: OrganizationOrderByWithRelationInput
  }

  export type ConsultantOrganizationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    consultantId_organizationId?: ConsultantOrganizationConsultantIdOrganizationIdCompoundUniqueInput
    AND?: ConsultantOrganizationWhereInput | ConsultantOrganizationWhereInput[]
    OR?: ConsultantOrganizationWhereInput[]
    NOT?: ConsultantOrganizationWhereInput | ConsultantOrganizationWhereInput[]
    consultantId?: StringFilter<"ConsultantOrganization"> | string
    organizationId?: StringFilter<"ConsultantOrganization"> | string
    createdAt?: DateTimeFilter<"ConsultantOrganization"> | Date | string
    consultant?: XOR<TicketingUserRelationFilter, TicketingUserWhereInput>
    organization?: XOR<OrganizationRelationFilter, OrganizationWhereInput>
  }, "id" | "consultantId_organizationId">

  export type ConsultantOrganizationOrderByWithAggregationInput = {
    id?: SortOrder
    consultantId?: SortOrder
    organizationId?: SortOrder
    createdAt?: SortOrder
    _count?: ConsultantOrganizationCountOrderByAggregateInput
    _max?: ConsultantOrganizationMaxOrderByAggregateInput
    _min?: ConsultantOrganizationMinOrderByAggregateInput
  }

  export type ConsultantOrganizationScalarWhereWithAggregatesInput = {
    AND?: ConsultantOrganizationScalarWhereWithAggregatesInput | ConsultantOrganizationScalarWhereWithAggregatesInput[]
    OR?: ConsultantOrganizationScalarWhereWithAggregatesInput[]
    NOT?: ConsultantOrganizationScalarWhereWithAggregatesInput | ConsultantOrganizationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ConsultantOrganization"> | string
    consultantId?: StringWithAggregatesFilter<"ConsultantOrganization"> | string
    organizationId?: StringWithAggregatesFilter<"ConsultantOrganization"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ConsultantOrganization"> | Date | string
  }

  export type TicketWhereInput = {
    AND?: TicketWhereInput | TicketWhereInput[]
    OR?: TicketWhereInput[]
    NOT?: TicketWhereInput | TicketWhereInput[]
    id?: StringFilter<"Ticket"> | string
    ticketNumber?: StringFilter<"Ticket"> | string
    organizationId?: StringFilter<"Ticket"> | string
    type?: EnumTicketTypeFilter<"Ticket"> | $Enums.TicketType
    priority?: EnumTicketPriorityFilter<"Ticket"> | $Enums.TicketPriority
    status?: EnumTicketStatusFilter<"Ticket"> | $Enums.TicketStatus
    subject?: StringFilter<"Ticket"> | string
    description?: StringFilter<"Ticket"> | string
    createdById?: StringFilter<"Ticket"> | string
    assignedToId?: StringNullableFilter<"Ticket"> | string | null
    createdAt?: DateTimeFilter<"Ticket"> | Date | string
    updatedAt?: DateTimeFilter<"Ticket"> | Date | string
    closedAt?: DateTimeNullableFilter<"Ticket"> | Date | string | null
    organization?: XOR<OrganizationRelationFilter, OrganizationWhereInput>
    createdBy?: XOR<TicketingUserRelationFilter, TicketingUserWhereInput>
    assignedTo?: XOR<TicketingUserNullableRelationFilter, TicketingUserWhereInput> | null
    messages?: TicketMessageListRelationFilter
    attachments?: TicketAttachmentListRelationFilter
    auditLogs?: TicketAuditLogListRelationFilter
  }

  export type TicketOrderByWithRelationInput = {
    id?: SortOrder
    ticketNumber?: SortOrder
    organizationId?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    createdById?: SortOrder
    assignedToId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    closedAt?: SortOrderInput | SortOrder
    organization?: OrganizationOrderByWithRelationInput
    createdBy?: TicketingUserOrderByWithRelationInput
    assignedTo?: TicketingUserOrderByWithRelationInput
    messages?: TicketMessageOrderByRelationAggregateInput
    attachments?: TicketAttachmentOrderByRelationAggregateInput
    auditLogs?: TicketAuditLogOrderByRelationAggregateInput
  }

  export type TicketWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketNumber?: string
    AND?: TicketWhereInput | TicketWhereInput[]
    OR?: TicketWhereInput[]
    NOT?: TicketWhereInput | TicketWhereInput[]
    organizationId?: StringFilter<"Ticket"> | string
    type?: EnumTicketTypeFilter<"Ticket"> | $Enums.TicketType
    priority?: EnumTicketPriorityFilter<"Ticket"> | $Enums.TicketPriority
    status?: EnumTicketStatusFilter<"Ticket"> | $Enums.TicketStatus
    subject?: StringFilter<"Ticket"> | string
    description?: StringFilter<"Ticket"> | string
    createdById?: StringFilter<"Ticket"> | string
    assignedToId?: StringNullableFilter<"Ticket"> | string | null
    createdAt?: DateTimeFilter<"Ticket"> | Date | string
    updatedAt?: DateTimeFilter<"Ticket"> | Date | string
    closedAt?: DateTimeNullableFilter<"Ticket"> | Date | string | null
    organization?: XOR<OrganizationRelationFilter, OrganizationWhereInput>
    createdBy?: XOR<TicketingUserRelationFilter, TicketingUserWhereInput>
    assignedTo?: XOR<TicketingUserNullableRelationFilter, TicketingUserWhereInput> | null
    messages?: TicketMessageListRelationFilter
    attachments?: TicketAttachmentListRelationFilter
    auditLogs?: TicketAuditLogListRelationFilter
  }, "id" | "ticketNumber">

  export type TicketOrderByWithAggregationInput = {
    id?: SortOrder
    ticketNumber?: SortOrder
    organizationId?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    createdById?: SortOrder
    assignedToId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    closedAt?: SortOrderInput | SortOrder
    _count?: TicketCountOrderByAggregateInput
    _max?: TicketMaxOrderByAggregateInput
    _min?: TicketMinOrderByAggregateInput
  }

  export type TicketScalarWhereWithAggregatesInput = {
    AND?: TicketScalarWhereWithAggregatesInput | TicketScalarWhereWithAggregatesInput[]
    OR?: TicketScalarWhereWithAggregatesInput[]
    NOT?: TicketScalarWhereWithAggregatesInput | TicketScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Ticket"> | string
    ticketNumber?: StringWithAggregatesFilter<"Ticket"> | string
    organizationId?: StringWithAggregatesFilter<"Ticket"> | string
    type?: EnumTicketTypeWithAggregatesFilter<"Ticket"> | $Enums.TicketType
    priority?: EnumTicketPriorityWithAggregatesFilter<"Ticket"> | $Enums.TicketPriority
    status?: EnumTicketStatusWithAggregatesFilter<"Ticket"> | $Enums.TicketStatus
    subject?: StringWithAggregatesFilter<"Ticket"> | string
    description?: StringWithAggregatesFilter<"Ticket"> | string
    createdById?: StringWithAggregatesFilter<"Ticket"> | string
    assignedToId?: StringNullableWithAggregatesFilter<"Ticket"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Ticket"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Ticket"> | Date | string
    closedAt?: DateTimeNullableWithAggregatesFilter<"Ticket"> | Date | string | null
  }

  export type TicketMessageWhereInput = {
    AND?: TicketMessageWhereInput | TicketMessageWhereInput[]
    OR?: TicketMessageWhereInput[]
    NOT?: TicketMessageWhereInput | TicketMessageWhereInput[]
    id?: StringFilter<"TicketMessage"> | string
    ticketId?: StringFilter<"TicketMessage"> | string
    authorId?: StringFilter<"TicketMessage"> | string
    body?: StringFilter<"TicketMessage"> | string
    isInternal?: BoolFilter<"TicketMessage"> | boolean
    createdAt?: DateTimeFilter<"TicketMessage"> | Date | string
    ticket?: XOR<TicketRelationFilter, TicketWhereInput>
    author?: XOR<TicketingUserRelationFilter, TicketingUserWhereInput>
  }

  export type TicketMessageOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    authorId?: SortOrder
    body?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
    ticket?: TicketOrderByWithRelationInput
    author?: TicketingUserOrderByWithRelationInput
  }

  export type TicketMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TicketMessageWhereInput | TicketMessageWhereInput[]
    OR?: TicketMessageWhereInput[]
    NOT?: TicketMessageWhereInput | TicketMessageWhereInput[]
    ticketId?: StringFilter<"TicketMessage"> | string
    authorId?: StringFilter<"TicketMessage"> | string
    body?: StringFilter<"TicketMessage"> | string
    isInternal?: BoolFilter<"TicketMessage"> | boolean
    createdAt?: DateTimeFilter<"TicketMessage"> | Date | string
    ticket?: XOR<TicketRelationFilter, TicketWhereInput>
    author?: XOR<TicketingUserRelationFilter, TicketingUserWhereInput>
  }, "id">

  export type TicketMessageOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    authorId?: SortOrder
    body?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
    _count?: TicketMessageCountOrderByAggregateInput
    _max?: TicketMessageMaxOrderByAggregateInput
    _min?: TicketMessageMinOrderByAggregateInput
  }

  export type TicketMessageScalarWhereWithAggregatesInput = {
    AND?: TicketMessageScalarWhereWithAggregatesInput | TicketMessageScalarWhereWithAggregatesInput[]
    OR?: TicketMessageScalarWhereWithAggregatesInput[]
    NOT?: TicketMessageScalarWhereWithAggregatesInput | TicketMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TicketMessage"> | string
    ticketId?: StringWithAggregatesFilter<"TicketMessage"> | string
    authorId?: StringWithAggregatesFilter<"TicketMessage"> | string
    body?: StringWithAggregatesFilter<"TicketMessage"> | string
    isInternal?: BoolWithAggregatesFilter<"TicketMessage"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"TicketMessage"> | Date | string
  }

  export type TicketAttachmentWhereInput = {
    AND?: TicketAttachmentWhereInput | TicketAttachmentWhereInput[]
    OR?: TicketAttachmentWhereInput[]
    NOT?: TicketAttachmentWhereInput | TicketAttachmentWhereInput[]
    id?: StringFilter<"TicketAttachment"> | string
    ticketId?: StringFilter<"TicketAttachment"> | string
    fileName?: StringFilter<"TicketAttachment"> | string
    fileUrl?: StringFilter<"TicketAttachment"> | string
    fileSize?: IntNullableFilter<"TicketAttachment"> | number | null
    uploadedById?: StringFilter<"TicketAttachment"> | string
    createdAt?: DateTimeFilter<"TicketAttachment"> | Date | string
    ticket?: XOR<TicketRelationFilter, TicketWhereInput>
  }

  export type TicketAttachmentOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    fileName?: SortOrder
    fileUrl?: SortOrder
    fileSize?: SortOrderInput | SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
    ticket?: TicketOrderByWithRelationInput
  }

  export type TicketAttachmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TicketAttachmentWhereInput | TicketAttachmentWhereInput[]
    OR?: TicketAttachmentWhereInput[]
    NOT?: TicketAttachmentWhereInput | TicketAttachmentWhereInput[]
    ticketId?: StringFilter<"TicketAttachment"> | string
    fileName?: StringFilter<"TicketAttachment"> | string
    fileUrl?: StringFilter<"TicketAttachment"> | string
    fileSize?: IntNullableFilter<"TicketAttachment"> | number | null
    uploadedById?: StringFilter<"TicketAttachment"> | string
    createdAt?: DateTimeFilter<"TicketAttachment"> | Date | string
    ticket?: XOR<TicketRelationFilter, TicketWhereInput>
  }, "id">

  export type TicketAttachmentOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    fileName?: SortOrder
    fileUrl?: SortOrder
    fileSize?: SortOrderInput | SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
    _count?: TicketAttachmentCountOrderByAggregateInput
    _avg?: TicketAttachmentAvgOrderByAggregateInput
    _max?: TicketAttachmentMaxOrderByAggregateInput
    _min?: TicketAttachmentMinOrderByAggregateInput
    _sum?: TicketAttachmentSumOrderByAggregateInput
  }

  export type TicketAttachmentScalarWhereWithAggregatesInput = {
    AND?: TicketAttachmentScalarWhereWithAggregatesInput | TicketAttachmentScalarWhereWithAggregatesInput[]
    OR?: TicketAttachmentScalarWhereWithAggregatesInput[]
    NOT?: TicketAttachmentScalarWhereWithAggregatesInput | TicketAttachmentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TicketAttachment"> | string
    ticketId?: StringWithAggregatesFilter<"TicketAttachment"> | string
    fileName?: StringWithAggregatesFilter<"TicketAttachment"> | string
    fileUrl?: StringWithAggregatesFilter<"TicketAttachment"> | string
    fileSize?: IntNullableWithAggregatesFilter<"TicketAttachment"> | number | null
    uploadedById?: StringWithAggregatesFilter<"TicketAttachment"> | string
    createdAt?: DateTimeWithAggregatesFilter<"TicketAttachment"> | Date | string
  }

  export type TicketAuditLogWhereInput = {
    AND?: TicketAuditLogWhereInput | TicketAuditLogWhereInput[]
    OR?: TicketAuditLogWhereInput[]
    NOT?: TicketAuditLogWhereInput | TicketAuditLogWhereInput[]
    id?: StringFilter<"TicketAuditLog"> | string
    ticketId?: StringFilter<"TicketAuditLog"> | string
    actorId?: StringNullableFilter<"TicketAuditLog"> | string | null
    action?: StringFilter<"TicketAuditLog"> | string
    field?: StringNullableFilter<"TicketAuditLog"> | string | null
    oldValue?: StringNullableFilter<"TicketAuditLog"> | string | null
    newValue?: StringNullableFilter<"TicketAuditLog"> | string | null
    metadata?: JsonNullableFilter<"TicketAuditLog">
    createdAt?: DateTimeFilter<"TicketAuditLog"> | Date | string
    ticket?: XOR<TicketRelationFilter, TicketWhereInput>
    actor?: XOR<TicketingUserNullableRelationFilter, TicketingUserWhereInput> | null
  }

  export type TicketAuditLogOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    actorId?: SortOrderInput | SortOrder
    action?: SortOrder
    field?: SortOrderInput | SortOrder
    oldValue?: SortOrderInput | SortOrder
    newValue?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    ticket?: TicketOrderByWithRelationInput
    actor?: TicketingUserOrderByWithRelationInput
  }

  export type TicketAuditLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TicketAuditLogWhereInput | TicketAuditLogWhereInput[]
    OR?: TicketAuditLogWhereInput[]
    NOT?: TicketAuditLogWhereInput | TicketAuditLogWhereInput[]
    ticketId?: StringFilter<"TicketAuditLog"> | string
    actorId?: StringNullableFilter<"TicketAuditLog"> | string | null
    action?: StringFilter<"TicketAuditLog"> | string
    field?: StringNullableFilter<"TicketAuditLog"> | string | null
    oldValue?: StringNullableFilter<"TicketAuditLog"> | string | null
    newValue?: StringNullableFilter<"TicketAuditLog"> | string | null
    metadata?: JsonNullableFilter<"TicketAuditLog">
    createdAt?: DateTimeFilter<"TicketAuditLog"> | Date | string
    ticket?: XOR<TicketRelationFilter, TicketWhereInput>
    actor?: XOR<TicketingUserNullableRelationFilter, TicketingUserWhereInput> | null
  }, "id">

  export type TicketAuditLogOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    actorId?: SortOrderInput | SortOrder
    action?: SortOrder
    field?: SortOrderInput | SortOrder
    oldValue?: SortOrderInput | SortOrder
    newValue?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: TicketAuditLogCountOrderByAggregateInput
    _max?: TicketAuditLogMaxOrderByAggregateInput
    _min?: TicketAuditLogMinOrderByAggregateInput
  }

  export type TicketAuditLogScalarWhereWithAggregatesInput = {
    AND?: TicketAuditLogScalarWhereWithAggregatesInput | TicketAuditLogScalarWhereWithAggregatesInput[]
    OR?: TicketAuditLogScalarWhereWithAggregatesInput[]
    NOT?: TicketAuditLogScalarWhereWithAggregatesInput | TicketAuditLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TicketAuditLog"> | string
    ticketId?: StringWithAggregatesFilter<"TicketAuditLog"> | string
    actorId?: StringNullableWithAggregatesFilter<"TicketAuditLog"> | string | null
    action?: StringWithAggregatesFilter<"TicketAuditLog"> | string
    field?: StringNullableWithAggregatesFilter<"TicketAuditLog"> | string | null
    oldValue?: StringNullableWithAggregatesFilter<"TicketAuditLog"> | string | null
    newValue?: StringNullableWithAggregatesFilter<"TicketAuditLog"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"TicketAuditLog">
    createdAt?: DateTimeWithAggregatesFilter<"TicketAuditLog"> | Date | string
  }

  export type OrganizationCreateInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: TicketingUserCreateNestedManyWithoutOrganizationInput
    tickets?: TicketCreateNestedManyWithoutOrganizationInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: TicketingUserUncheckedCreateNestedManyWithoutOrganizationInput
    tickets?: TicketUncheckedCreateNestedManyWithoutOrganizationInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: TicketingUserUpdateManyWithoutOrganizationNestedInput
    tickets?: TicketUpdateManyWithoutOrganizationNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: TicketingUserUncheckedUpdateManyWithoutOrganizationNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutOrganizationNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationCreateManyInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OrganizationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrganizationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketingUserCreateInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    organization?: OrganizationCreateNestedOneWithoutUsersInput
    createdTickets?: TicketCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserUncheckedCreateInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    organizationId?: string | null
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketUncheckedCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageUncheckedCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneWithoutUsersNestedInput
    createdTickets?: TicketUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUncheckedUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUncheckedUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserCreateManyInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    organizationId?: string | null
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TicketingUserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketingUserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsultantOrganizationCreateInput = {
    id?: string
    createdAt?: Date | string
    consultant: TicketingUserCreateNestedOneWithoutConsultantOrganizationsInput
    organization: OrganizationCreateNestedOneWithoutConsultantOrganizationsInput
  }

  export type ConsultantOrganizationUncheckedCreateInput = {
    id?: string
    consultantId: string
    organizationId: string
    createdAt?: Date | string
  }

  export type ConsultantOrganizationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    consultant?: TicketingUserUpdateOneRequiredWithoutConsultantOrganizationsNestedInput
    organization?: OrganizationUpdateOneRequiredWithoutConsultantOrganizationsNestedInput
  }

  export type ConsultantOrganizationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    consultantId?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsultantOrganizationCreateManyInput = {
    id?: string
    consultantId: string
    organizationId: string
    createdAt?: Date | string
  }

  export type ConsultantOrganizationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsultantOrganizationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    consultantId?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketCreateInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    organization: OrganizationCreateNestedOneWithoutTicketsInput
    createdBy: TicketingUserCreateNestedOneWithoutCreatedTicketsInput
    assignedTo?: TicketingUserCreateNestedOneWithoutAssignedTicketsInput
    messages?: TicketMessageCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    messages?: TicketMessageUncheckedCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentUncheckedCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    organization?: OrganizationUpdateOneRequiredWithoutTicketsNestedInput
    createdBy?: TicketingUserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    assignedTo?: TicketingUserUpdateOneWithoutAssignedTicketsNestedInput
    messages?: TicketMessageUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: TicketMessageUncheckedUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUncheckedUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketCreateManyInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
  }

  export type TicketUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TicketUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TicketMessageCreateInput = {
    id?: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
    ticket: TicketCreateNestedOneWithoutMessagesInput
    author: TicketingUserCreateNestedOneWithoutMessagesInput
  }

  export type TicketMessageUncheckedCreateInput = {
    id?: string
    ticketId: string
    authorId: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type TicketMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: TicketUpdateOneRequiredWithoutMessagesNestedInput
    author?: TicketingUserUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type TicketMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketMessageCreateManyInput = {
    id?: string
    ticketId: string
    authorId: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type TicketMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAttachmentCreateInput = {
    id?: string
    fileName: string
    fileUrl: string
    fileSize?: number | null
    uploadedById: string
    createdAt?: Date | string
    ticket: TicketCreateNestedOneWithoutAttachmentsInput
  }

  export type TicketAttachmentUncheckedCreateInput = {
    id?: string
    ticketId: string
    fileName: string
    fileUrl: string
    fileSize?: number | null
    uploadedById: string
    createdAt?: Date | string
  }

  export type TicketAttachmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: TicketUpdateOneRequiredWithoutAttachmentsNestedInput
  }

  export type TicketAttachmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAttachmentCreateManyInput = {
    id?: string
    ticketId: string
    fileName: string
    fileUrl: string
    fileSize?: number | null
    uploadedById: string
    createdAt?: Date | string
  }

  export type TicketAttachmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAttachmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAuditLogCreateInput = {
    id?: string
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    ticket: TicketCreateNestedOneWithoutAuditLogsInput
    actor?: TicketingUserCreateNestedOneWithoutAuditLogsInput
  }

  export type TicketAuditLogUncheckedCreateInput = {
    id?: string
    ticketId: string
    actorId?: string | null
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type TicketAuditLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: TicketUpdateOneRequiredWithoutAuditLogsNestedInput
    actor?: TicketingUserUpdateOneWithoutAuditLogsNestedInput
  }

  export type TicketAuditLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    actorId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAuditLogCreateManyInput = {
    id?: string
    ticketId: string
    actorId?: string | null
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type TicketAuditLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAuditLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    actorId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type TicketingUserListRelationFilter = {
    every?: TicketingUserWhereInput
    some?: TicketingUserWhereInput
    none?: TicketingUserWhereInput
  }

  export type TicketListRelationFilter = {
    every?: TicketWhereInput
    some?: TicketWhereInput
    none?: TicketWhereInput
  }

  export type ConsultantOrganizationListRelationFilter = {
    every?: ConsultantOrganizationWhereInput
    some?: ConsultantOrganizationWhereInput
    none?: ConsultantOrganizationWhereInput
  }

  export type TicketingUserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TicketOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConsultantOrganizationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type OrganizationCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OrganizationMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OrganizationMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumTicketingUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketingUserRole | EnumTicketingUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.TicketingUserRole[] | ListEnumTicketingUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketingUserRole[] | ListEnumTicketingUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketingUserRoleFilter<$PrismaModel> | $Enums.TicketingUserRole
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type OrganizationNullableRelationFilter = {
    is?: OrganizationWhereInput | null
    isNot?: OrganizationWhereInput | null
  }

  export type TicketMessageListRelationFilter = {
    every?: TicketMessageWhereInput
    some?: TicketMessageWhereInput
    none?: TicketMessageWhereInput
  }

  export type TicketAuditLogListRelationFilter = {
    every?: TicketAuditLogWhereInput
    some?: TicketAuditLogWhereInput
    none?: TicketAuditLogWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TicketMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TicketAuditLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TicketingUserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    organizationId?: SortOrder
    consultantVerified?: SortOrder
    tbosAdminUserId?: SortOrder
    tbosRole?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TicketingUserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    organizationId?: SortOrder
    consultantVerified?: SortOrder
    tbosAdminUserId?: SortOrder
    tbosRole?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TicketingUserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    organizationId?: SortOrder
    consultantVerified?: SortOrder
    tbosAdminUserId?: SortOrder
    tbosRole?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumTicketingUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketingUserRole | EnumTicketingUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.TicketingUserRole[] | ListEnumTicketingUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketingUserRole[] | ListEnumTicketingUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketingUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.TicketingUserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketingUserRoleFilter<$PrismaModel>
    _max?: NestedEnumTicketingUserRoleFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type TicketingUserRelationFilter = {
    is?: TicketingUserWhereInput
    isNot?: TicketingUserWhereInput
  }

  export type OrganizationRelationFilter = {
    is?: OrganizationWhereInput
    isNot?: OrganizationWhereInput
  }

  export type ConsultantOrganizationConsultantIdOrganizationIdCompoundUniqueInput = {
    consultantId: string
    organizationId: string
  }

  export type ConsultantOrganizationCountOrderByAggregateInput = {
    id?: SortOrder
    consultantId?: SortOrder
    organizationId?: SortOrder
    createdAt?: SortOrder
  }

  export type ConsultantOrganizationMaxOrderByAggregateInput = {
    id?: SortOrder
    consultantId?: SortOrder
    organizationId?: SortOrder
    createdAt?: SortOrder
  }

  export type ConsultantOrganizationMinOrderByAggregateInput = {
    id?: SortOrder
    consultantId?: SortOrder
    organizationId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumTicketTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketType | EnumTicketTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TicketType[] | ListEnumTicketTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketType[] | ListEnumTicketTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketTypeFilter<$PrismaModel> | $Enums.TicketType
  }

  export type EnumTicketPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketPriority | EnumTicketPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.TicketPriority[] | ListEnumTicketPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketPriority[] | ListEnumTicketPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketPriorityFilter<$PrismaModel> | $Enums.TicketPriority
  }

  export type EnumTicketStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketStatus | EnumTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TicketStatus[] | ListEnumTicketStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketStatus[] | ListEnumTicketStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketStatusFilter<$PrismaModel> | $Enums.TicketStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type TicketingUserNullableRelationFilter = {
    is?: TicketingUserWhereInput | null
    isNot?: TicketingUserWhereInput | null
  }

  export type TicketAttachmentListRelationFilter = {
    every?: TicketAttachmentWhereInput
    some?: TicketAttachmentWhereInput
    none?: TicketAttachmentWhereInput
  }

  export type TicketAttachmentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TicketCountOrderByAggregateInput = {
    id?: SortOrder
    ticketNumber?: SortOrder
    organizationId?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    createdById?: SortOrder
    assignedToId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    closedAt?: SortOrder
  }

  export type TicketMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketNumber?: SortOrder
    organizationId?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    createdById?: SortOrder
    assignedToId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    closedAt?: SortOrder
  }

  export type TicketMinOrderByAggregateInput = {
    id?: SortOrder
    ticketNumber?: SortOrder
    organizationId?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    createdById?: SortOrder
    assignedToId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    closedAt?: SortOrder
  }

  export type EnumTicketTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketType | EnumTicketTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TicketType[] | ListEnumTicketTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketType[] | ListEnumTicketTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketTypeWithAggregatesFilter<$PrismaModel> | $Enums.TicketType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketTypeFilter<$PrismaModel>
    _max?: NestedEnumTicketTypeFilter<$PrismaModel>
  }

  export type EnumTicketPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketPriority | EnumTicketPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.TicketPriority[] | ListEnumTicketPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketPriority[] | ListEnumTicketPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketPriorityWithAggregatesFilter<$PrismaModel> | $Enums.TicketPriority
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketPriorityFilter<$PrismaModel>
    _max?: NestedEnumTicketPriorityFilter<$PrismaModel>
  }

  export type EnumTicketStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketStatus | EnumTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TicketStatus[] | ListEnumTicketStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketStatus[] | ListEnumTicketStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketStatusWithAggregatesFilter<$PrismaModel> | $Enums.TicketStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketStatusFilter<$PrismaModel>
    _max?: NestedEnumTicketStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type TicketRelationFilter = {
    is?: TicketWhereInput
    isNot?: TicketWhereInput
  }

  export type TicketMessageCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    authorId?: SortOrder
    body?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
  }

  export type TicketMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    authorId?: SortOrder
    body?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
  }

  export type TicketMessageMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    authorId?: SortOrder
    body?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type TicketAttachmentCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    fileName?: SortOrder
    fileUrl?: SortOrder
    fileSize?: SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
  }

  export type TicketAttachmentAvgOrderByAggregateInput = {
    fileSize?: SortOrder
  }

  export type TicketAttachmentMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    fileName?: SortOrder
    fileUrl?: SortOrder
    fileSize?: SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
  }

  export type TicketAttachmentMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    fileName?: SortOrder
    fileUrl?: SortOrder
    fileSize?: SortOrder
    uploadedById?: SortOrder
    createdAt?: SortOrder
  }

  export type TicketAttachmentSumOrderByAggregateInput = {
    fileSize?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type TicketAuditLogCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    actorId?: SortOrder
    action?: SortOrder
    field?: SortOrder
    oldValue?: SortOrder
    newValue?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type TicketAuditLogMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    actorId?: SortOrder
    action?: SortOrder
    field?: SortOrder
    oldValue?: SortOrder
    newValue?: SortOrder
    createdAt?: SortOrder
  }

  export type TicketAuditLogMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    actorId?: SortOrder
    action?: SortOrder
    field?: SortOrder
    oldValue?: SortOrder
    newValue?: SortOrder
    createdAt?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type TicketingUserCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<TicketingUserCreateWithoutOrganizationInput, TicketingUserUncheckedCreateWithoutOrganizationInput> | TicketingUserCreateWithoutOrganizationInput[] | TicketingUserUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: TicketingUserCreateOrConnectWithoutOrganizationInput | TicketingUserCreateOrConnectWithoutOrganizationInput[]
    createMany?: TicketingUserCreateManyOrganizationInputEnvelope
    connect?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
  }

  export type TicketCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<TicketCreateWithoutOrganizationInput, TicketUncheckedCreateWithoutOrganizationInput> | TicketCreateWithoutOrganizationInput[] | TicketUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutOrganizationInput | TicketCreateOrConnectWithoutOrganizationInput[]
    createMany?: TicketCreateManyOrganizationInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type ConsultantOrganizationCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<ConsultantOrganizationCreateWithoutOrganizationInput, ConsultantOrganizationUncheckedCreateWithoutOrganizationInput> | ConsultantOrganizationCreateWithoutOrganizationInput[] | ConsultantOrganizationUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: ConsultantOrganizationCreateOrConnectWithoutOrganizationInput | ConsultantOrganizationCreateOrConnectWithoutOrganizationInput[]
    createMany?: ConsultantOrganizationCreateManyOrganizationInputEnvelope
    connect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
  }

  export type TicketingUserUncheckedCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<TicketingUserCreateWithoutOrganizationInput, TicketingUserUncheckedCreateWithoutOrganizationInput> | TicketingUserCreateWithoutOrganizationInput[] | TicketingUserUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: TicketingUserCreateOrConnectWithoutOrganizationInput | TicketingUserCreateOrConnectWithoutOrganizationInput[]
    createMany?: TicketingUserCreateManyOrganizationInputEnvelope
    connect?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
  }

  export type TicketUncheckedCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<TicketCreateWithoutOrganizationInput, TicketUncheckedCreateWithoutOrganizationInput> | TicketCreateWithoutOrganizationInput[] | TicketUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutOrganizationInput | TicketCreateOrConnectWithoutOrganizationInput[]
    createMany?: TicketCreateManyOrganizationInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type ConsultantOrganizationUncheckedCreateNestedManyWithoutOrganizationInput = {
    create?: XOR<ConsultantOrganizationCreateWithoutOrganizationInput, ConsultantOrganizationUncheckedCreateWithoutOrganizationInput> | ConsultantOrganizationCreateWithoutOrganizationInput[] | ConsultantOrganizationUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: ConsultantOrganizationCreateOrConnectWithoutOrganizationInput | ConsultantOrganizationCreateOrConnectWithoutOrganizationInput[]
    createMany?: ConsultantOrganizationCreateManyOrganizationInputEnvelope
    connect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type TicketingUserUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<TicketingUserCreateWithoutOrganizationInput, TicketingUserUncheckedCreateWithoutOrganizationInput> | TicketingUserCreateWithoutOrganizationInput[] | TicketingUserUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: TicketingUserCreateOrConnectWithoutOrganizationInput | TicketingUserCreateOrConnectWithoutOrganizationInput[]
    upsert?: TicketingUserUpsertWithWhereUniqueWithoutOrganizationInput | TicketingUserUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: TicketingUserCreateManyOrganizationInputEnvelope
    set?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
    disconnect?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
    delete?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
    connect?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
    update?: TicketingUserUpdateWithWhereUniqueWithoutOrganizationInput | TicketingUserUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: TicketingUserUpdateManyWithWhereWithoutOrganizationInput | TicketingUserUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: TicketingUserScalarWhereInput | TicketingUserScalarWhereInput[]
  }

  export type TicketUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<TicketCreateWithoutOrganizationInput, TicketUncheckedCreateWithoutOrganizationInput> | TicketCreateWithoutOrganizationInput[] | TicketUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutOrganizationInput | TicketCreateOrConnectWithoutOrganizationInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutOrganizationInput | TicketUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: TicketCreateManyOrganizationInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutOrganizationInput | TicketUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutOrganizationInput | TicketUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type ConsultantOrganizationUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<ConsultantOrganizationCreateWithoutOrganizationInput, ConsultantOrganizationUncheckedCreateWithoutOrganizationInput> | ConsultantOrganizationCreateWithoutOrganizationInput[] | ConsultantOrganizationUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: ConsultantOrganizationCreateOrConnectWithoutOrganizationInput | ConsultantOrganizationCreateOrConnectWithoutOrganizationInput[]
    upsert?: ConsultantOrganizationUpsertWithWhereUniqueWithoutOrganizationInput | ConsultantOrganizationUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: ConsultantOrganizationCreateManyOrganizationInputEnvelope
    set?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    disconnect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    delete?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    connect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    update?: ConsultantOrganizationUpdateWithWhereUniqueWithoutOrganizationInput | ConsultantOrganizationUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: ConsultantOrganizationUpdateManyWithWhereWithoutOrganizationInput | ConsultantOrganizationUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: ConsultantOrganizationScalarWhereInput | ConsultantOrganizationScalarWhereInput[]
  }

  export type TicketingUserUncheckedUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<TicketingUserCreateWithoutOrganizationInput, TicketingUserUncheckedCreateWithoutOrganizationInput> | TicketingUserCreateWithoutOrganizationInput[] | TicketingUserUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: TicketingUserCreateOrConnectWithoutOrganizationInput | TicketingUserCreateOrConnectWithoutOrganizationInput[]
    upsert?: TicketingUserUpsertWithWhereUniqueWithoutOrganizationInput | TicketingUserUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: TicketingUserCreateManyOrganizationInputEnvelope
    set?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
    disconnect?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
    delete?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
    connect?: TicketingUserWhereUniqueInput | TicketingUserWhereUniqueInput[]
    update?: TicketingUserUpdateWithWhereUniqueWithoutOrganizationInput | TicketingUserUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: TicketingUserUpdateManyWithWhereWithoutOrganizationInput | TicketingUserUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: TicketingUserScalarWhereInput | TicketingUserScalarWhereInput[]
  }

  export type TicketUncheckedUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<TicketCreateWithoutOrganizationInput, TicketUncheckedCreateWithoutOrganizationInput> | TicketCreateWithoutOrganizationInput[] | TicketUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutOrganizationInput | TicketCreateOrConnectWithoutOrganizationInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutOrganizationInput | TicketUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: TicketCreateManyOrganizationInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutOrganizationInput | TicketUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutOrganizationInput | TicketUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type ConsultantOrganizationUncheckedUpdateManyWithoutOrganizationNestedInput = {
    create?: XOR<ConsultantOrganizationCreateWithoutOrganizationInput, ConsultantOrganizationUncheckedCreateWithoutOrganizationInput> | ConsultantOrganizationCreateWithoutOrganizationInput[] | ConsultantOrganizationUncheckedCreateWithoutOrganizationInput[]
    connectOrCreate?: ConsultantOrganizationCreateOrConnectWithoutOrganizationInput | ConsultantOrganizationCreateOrConnectWithoutOrganizationInput[]
    upsert?: ConsultantOrganizationUpsertWithWhereUniqueWithoutOrganizationInput | ConsultantOrganizationUpsertWithWhereUniqueWithoutOrganizationInput[]
    createMany?: ConsultantOrganizationCreateManyOrganizationInputEnvelope
    set?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    disconnect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    delete?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    connect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    update?: ConsultantOrganizationUpdateWithWhereUniqueWithoutOrganizationInput | ConsultantOrganizationUpdateWithWhereUniqueWithoutOrganizationInput[]
    updateMany?: ConsultantOrganizationUpdateManyWithWhereWithoutOrganizationInput | ConsultantOrganizationUpdateManyWithWhereWithoutOrganizationInput[]
    deleteMany?: ConsultantOrganizationScalarWhereInput | ConsultantOrganizationScalarWhereInput[]
  }

  export type OrganizationCreateNestedOneWithoutUsersInput = {
    create?: XOR<OrganizationCreateWithoutUsersInput, OrganizationUncheckedCreateWithoutUsersInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutUsersInput
    connect?: OrganizationWhereUniqueInput
  }

  export type TicketCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<TicketCreateWithoutCreatedByInput, TicketUncheckedCreateWithoutCreatedByInput> | TicketCreateWithoutCreatedByInput[] | TicketUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCreatedByInput | TicketCreateOrConnectWithoutCreatedByInput[]
    createMany?: TicketCreateManyCreatedByInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type TicketCreateNestedManyWithoutAssignedToInput = {
    create?: XOR<TicketCreateWithoutAssignedToInput, TicketUncheckedCreateWithoutAssignedToInput> | TicketCreateWithoutAssignedToInput[] | TicketUncheckedCreateWithoutAssignedToInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutAssignedToInput | TicketCreateOrConnectWithoutAssignedToInput[]
    createMany?: TicketCreateManyAssignedToInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type TicketMessageCreateNestedManyWithoutAuthorInput = {
    create?: XOR<TicketMessageCreateWithoutAuthorInput, TicketMessageUncheckedCreateWithoutAuthorInput> | TicketMessageCreateWithoutAuthorInput[] | TicketMessageUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: TicketMessageCreateOrConnectWithoutAuthorInput | TicketMessageCreateOrConnectWithoutAuthorInput[]
    createMany?: TicketMessageCreateManyAuthorInputEnvelope
    connect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
  }

  export type TicketAuditLogCreateNestedManyWithoutActorInput = {
    create?: XOR<TicketAuditLogCreateWithoutActorInput, TicketAuditLogUncheckedCreateWithoutActorInput> | TicketAuditLogCreateWithoutActorInput[] | TicketAuditLogUncheckedCreateWithoutActorInput[]
    connectOrCreate?: TicketAuditLogCreateOrConnectWithoutActorInput | TicketAuditLogCreateOrConnectWithoutActorInput[]
    createMany?: TicketAuditLogCreateManyActorInputEnvelope
    connect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
  }

  export type ConsultantOrganizationCreateNestedManyWithoutConsultantInput = {
    create?: XOR<ConsultantOrganizationCreateWithoutConsultantInput, ConsultantOrganizationUncheckedCreateWithoutConsultantInput> | ConsultantOrganizationCreateWithoutConsultantInput[] | ConsultantOrganizationUncheckedCreateWithoutConsultantInput[]
    connectOrCreate?: ConsultantOrganizationCreateOrConnectWithoutConsultantInput | ConsultantOrganizationCreateOrConnectWithoutConsultantInput[]
    createMany?: ConsultantOrganizationCreateManyConsultantInputEnvelope
    connect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
  }

  export type TicketUncheckedCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<TicketCreateWithoutCreatedByInput, TicketUncheckedCreateWithoutCreatedByInput> | TicketCreateWithoutCreatedByInput[] | TicketUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCreatedByInput | TicketCreateOrConnectWithoutCreatedByInput[]
    createMany?: TicketCreateManyCreatedByInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type TicketUncheckedCreateNestedManyWithoutAssignedToInput = {
    create?: XOR<TicketCreateWithoutAssignedToInput, TicketUncheckedCreateWithoutAssignedToInput> | TicketCreateWithoutAssignedToInput[] | TicketUncheckedCreateWithoutAssignedToInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutAssignedToInput | TicketCreateOrConnectWithoutAssignedToInput[]
    createMany?: TicketCreateManyAssignedToInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type TicketMessageUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: XOR<TicketMessageCreateWithoutAuthorInput, TicketMessageUncheckedCreateWithoutAuthorInput> | TicketMessageCreateWithoutAuthorInput[] | TicketMessageUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: TicketMessageCreateOrConnectWithoutAuthorInput | TicketMessageCreateOrConnectWithoutAuthorInput[]
    createMany?: TicketMessageCreateManyAuthorInputEnvelope
    connect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
  }

  export type TicketAuditLogUncheckedCreateNestedManyWithoutActorInput = {
    create?: XOR<TicketAuditLogCreateWithoutActorInput, TicketAuditLogUncheckedCreateWithoutActorInput> | TicketAuditLogCreateWithoutActorInput[] | TicketAuditLogUncheckedCreateWithoutActorInput[]
    connectOrCreate?: TicketAuditLogCreateOrConnectWithoutActorInput | TicketAuditLogCreateOrConnectWithoutActorInput[]
    createMany?: TicketAuditLogCreateManyActorInputEnvelope
    connect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
  }

  export type ConsultantOrganizationUncheckedCreateNestedManyWithoutConsultantInput = {
    create?: XOR<ConsultantOrganizationCreateWithoutConsultantInput, ConsultantOrganizationUncheckedCreateWithoutConsultantInput> | ConsultantOrganizationCreateWithoutConsultantInput[] | ConsultantOrganizationUncheckedCreateWithoutConsultantInput[]
    connectOrCreate?: ConsultantOrganizationCreateOrConnectWithoutConsultantInput | ConsultantOrganizationCreateOrConnectWithoutConsultantInput[]
    createMany?: ConsultantOrganizationCreateManyConsultantInputEnvelope
    connect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
  }

  export type EnumTicketingUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.TicketingUserRole
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type OrganizationUpdateOneWithoutUsersNestedInput = {
    create?: XOR<OrganizationCreateWithoutUsersInput, OrganizationUncheckedCreateWithoutUsersInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutUsersInput
    upsert?: OrganizationUpsertWithoutUsersInput
    disconnect?: OrganizationWhereInput | boolean
    delete?: OrganizationWhereInput | boolean
    connect?: OrganizationWhereUniqueInput
    update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutUsersInput, OrganizationUpdateWithoutUsersInput>, OrganizationUncheckedUpdateWithoutUsersInput>
  }

  export type TicketUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<TicketCreateWithoutCreatedByInput, TicketUncheckedCreateWithoutCreatedByInput> | TicketCreateWithoutCreatedByInput[] | TicketUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCreatedByInput | TicketCreateOrConnectWithoutCreatedByInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutCreatedByInput | TicketUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: TicketCreateManyCreatedByInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutCreatedByInput | TicketUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutCreatedByInput | TicketUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type TicketUpdateManyWithoutAssignedToNestedInput = {
    create?: XOR<TicketCreateWithoutAssignedToInput, TicketUncheckedCreateWithoutAssignedToInput> | TicketCreateWithoutAssignedToInput[] | TicketUncheckedCreateWithoutAssignedToInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutAssignedToInput | TicketCreateOrConnectWithoutAssignedToInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutAssignedToInput | TicketUpsertWithWhereUniqueWithoutAssignedToInput[]
    createMany?: TicketCreateManyAssignedToInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutAssignedToInput | TicketUpdateWithWhereUniqueWithoutAssignedToInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutAssignedToInput | TicketUpdateManyWithWhereWithoutAssignedToInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type TicketMessageUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<TicketMessageCreateWithoutAuthorInput, TicketMessageUncheckedCreateWithoutAuthorInput> | TicketMessageCreateWithoutAuthorInput[] | TicketMessageUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: TicketMessageCreateOrConnectWithoutAuthorInput | TicketMessageCreateOrConnectWithoutAuthorInput[]
    upsert?: TicketMessageUpsertWithWhereUniqueWithoutAuthorInput | TicketMessageUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: TicketMessageCreateManyAuthorInputEnvelope
    set?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    disconnect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    delete?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    connect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    update?: TicketMessageUpdateWithWhereUniqueWithoutAuthorInput | TicketMessageUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: TicketMessageUpdateManyWithWhereWithoutAuthorInput | TicketMessageUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: TicketMessageScalarWhereInput | TicketMessageScalarWhereInput[]
  }

  export type TicketAuditLogUpdateManyWithoutActorNestedInput = {
    create?: XOR<TicketAuditLogCreateWithoutActorInput, TicketAuditLogUncheckedCreateWithoutActorInput> | TicketAuditLogCreateWithoutActorInput[] | TicketAuditLogUncheckedCreateWithoutActorInput[]
    connectOrCreate?: TicketAuditLogCreateOrConnectWithoutActorInput | TicketAuditLogCreateOrConnectWithoutActorInput[]
    upsert?: TicketAuditLogUpsertWithWhereUniqueWithoutActorInput | TicketAuditLogUpsertWithWhereUniqueWithoutActorInput[]
    createMany?: TicketAuditLogCreateManyActorInputEnvelope
    set?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    disconnect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    delete?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    connect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    update?: TicketAuditLogUpdateWithWhereUniqueWithoutActorInput | TicketAuditLogUpdateWithWhereUniqueWithoutActorInput[]
    updateMany?: TicketAuditLogUpdateManyWithWhereWithoutActorInput | TicketAuditLogUpdateManyWithWhereWithoutActorInput[]
    deleteMany?: TicketAuditLogScalarWhereInput | TicketAuditLogScalarWhereInput[]
  }

  export type ConsultantOrganizationUpdateManyWithoutConsultantNestedInput = {
    create?: XOR<ConsultantOrganizationCreateWithoutConsultantInput, ConsultantOrganizationUncheckedCreateWithoutConsultantInput> | ConsultantOrganizationCreateWithoutConsultantInput[] | ConsultantOrganizationUncheckedCreateWithoutConsultantInput[]
    connectOrCreate?: ConsultantOrganizationCreateOrConnectWithoutConsultantInput | ConsultantOrganizationCreateOrConnectWithoutConsultantInput[]
    upsert?: ConsultantOrganizationUpsertWithWhereUniqueWithoutConsultantInput | ConsultantOrganizationUpsertWithWhereUniqueWithoutConsultantInput[]
    createMany?: ConsultantOrganizationCreateManyConsultantInputEnvelope
    set?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    disconnect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    delete?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    connect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    update?: ConsultantOrganizationUpdateWithWhereUniqueWithoutConsultantInput | ConsultantOrganizationUpdateWithWhereUniqueWithoutConsultantInput[]
    updateMany?: ConsultantOrganizationUpdateManyWithWhereWithoutConsultantInput | ConsultantOrganizationUpdateManyWithWhereWithoutConsultantInput[]
    deleteMany?: ConsultantOrganizationScalarWhereInput | ConsultantOrganizationScalarWhereInput[]
  }

  export type TicketUncheckedUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<TicketCreateWithoutCreatedByInput, TicketUncheckedCreateWithoutCreatedByInput> | TicketCreateWithoutCreatedByInput[] | TicketUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCreatedByInput | TicketCreateOrConnectWithoutCreatedByInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutCreatedByInput | TicketUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: TicketCreateManyCreatedByInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutCreatedByInput | TicketUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutCreatedByInput | TicketUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type TicketUncheckedUpdateManyWithoutAssignedToNestedInput = {
    create?: XOR<TicketCreateWithoutAssignedToInput, TicketUncheckedCreateWithoutAssignedToInput> | TicketCreateWithoutAssignedToInput[] | TicketUncheckedCreateWithoutAssignedToInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutAssignedToInput | TicketCreateOrConnectWithoutAssignedToInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutAssignedToInput | TicketUpsertWithWhereUniqueWithoutAssignedToInput[]
    createMany?: TicketCreateManyAssignedToInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutAssignedToInput | TicketUpdateWithWhereUniqueWithoutAssignedToInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutAssignedToInput | TicketUpdateManyWithWhereWithoutAssignedToInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type TicketMessageUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<TicketMessageCreateWithoutAuthorInput, TicketMessageUncheckedCreateWithoutAuthorInput> | TicketMessageCreateWithoutAuthorInput[] | TicketMessageUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: TicketMessageCreateOrConnectWithoutAuthorInput | TicketMessageCreateOrConnectWithoutAuthorInput[]
    upsert?: TicketMessageUpsertWithWhereUniqueWithoutAuthorInput | TicketMessageUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: TicketMessageCreateManyAuthorInputEnvelope
    set?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    disconnect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    delete?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    connect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    update?: TicketMessageUpdateWithWhereUniqueWithoutAuthorInput | TicketMessageUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: TicketMessageUpdateManyWithWhereWithoutAuthorInput | TicketMessageUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: TicketMessageScalarWhereInput | TicketMessageScalarWhereInput[]
  }

  export type TicketAuditLogUncheckedUpdateManyWithoutActorNestedInput = {
    create?: XOR<TicketAuditLogCreateWithoutActorInput, TicketAuditLogUncheckedCreateWithoutActorInput> | TicketAuditLogCreateWithoutActorInput[] | TicketAuditLogUncheckedCreateWithoutActorInput[]
    connectOrCreate?: TicketAuditLogCreateOrConnectWithoutActorInput | TicketAuditLogCreateOrConnectWithoutActorInput[]
    upsert?: TicketAuditLogUpsertWithWhereUniqueWithoutActorInput | TicketAuditLogUpsertWithWhereUniqueWithoutActorInput[]
    createMany?: TicketAuditLogCreateManyActorInputEnvelope
    set?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    disconnect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    delete?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    connect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    update?: TicketAuditLogUpdateWithWhereUniqueWithoutActorInput | TicketAuditLogUpdateWithWhereUniqueWithoutActorInput[]
    updateMany?: TicketAuditLogUpdateManyWithWhereWithoutActorInput | TicketAuditLogUpdateManyWithWhereWithoutActorInput[]
    deleteMany?: TicketAuditLogScalarWhereInput | TicketAuditLogScalarWhereInput[]
  }

  export type ConsultantOrganizationUncheckedUpdateManyWithoutConsultantNestedInput = {
    create?: XOR<ConsultantOrganizationCreateWithoutConsultantInput, ConsultantOrganizationUncheckedCreateWithoutConsultantInput> | ConsultantOrganizationCreateWithoutConsultantInput[] | ConsultantOrganizationUncheckedCreateWithoutConsultantInput[]
    connectOrCreate?: ConsultantOrganizationCreateOrConnectWithoutConsultantInput | ConsultantOrganizationCreateOrConnectWithoutConsultantInput[]
    upsert?: ConsultantOrganizationUpsertWithWhereUniqueWithoutConsultantInput | ConsultantOrganizationUpsertWithWhereUniqueWithoutConsultantInput[]
    createMany?: ConsultantOrganizationCreateManyConsultantInputEnvelope
    set?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    disconnect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    delete?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    connect?: ConsultantOrganizationWhereUniqueInput | ConsultantOrganizationWhereUniqueInput[]
    update?: ConsultantOrganizationUpdateWithWhereUniqueWithoutConsultantInput | ConsultantOrganizationUpdateWithWhereUniqueWithoutConsultantInput[]
    updateMany?: ConsultantOrganizationUpdateManyWithWhereWithoutConsultantInput | ConsultantOrganizationUpdateManyWithWhereWithoutConsultantInput[]
    deleteMany?: ConsultantOrganizationScalarWhereInput | ConsultantOrganizationScalarWhereInput[]
  }

  export type TicketingUserCreateNestedOneWithoutConsultantOrganizationsInput = {
    create?: XOR<TicketingUserCreateWithoutConsultantOrganizationsInput, TicketingUserUncheckedCreateWithoutConsultantOrganizationsInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutConsultantOrganizationsInput
    connect?: TicketingUserWhereUniqueInput
  }

  export type OrganizationCreateNestedOneWithoutConsultantOrganizationsInput = {
    create?: XOR<OrganizationCreateWithoutConsultantOrganizationsInput, OrganizationUncheckedCreateWithoutConsultantOrganizationsInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutConsultantOrganizationsInput
    connect?: OrganizationWhereUniqueInput
  }

  export type TicketingUserUpdateOneRequiredWithoutConsultantOrganizationsNestedInput = {
    create?: XOR<TicketingUserCreateWithoutConsultantOrganizationsInput, TicketingUserUncheckedCreateWithoutConsultantOrganizationsInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutConsultantOrganizationsInput
    upsert?: TicketingUserUpsertWithoutConsultantOrganizationsInput
    connect?: TicketingUserWhereUniqueInput
    update?: XOR<XOR<TicketingUserUpdateToOneWithWhereWithoutConsultantOrganizationsInput, TicketingUserUpdateWithoutConsultantOrganizationsInput>, TicketingUserUncheckedUpdateWithoutConsultantOrganizationsInput>
  }

  export type OrganizationUpdateOneRequiredWithoutConsultantOrganizationsNestedInput = {
    create?: XOR<OrganizationCreateWithoutConsultantOrganizationsInput, OrganizationUncheckedCreateWithoutConsultantOrganizationsInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutConsultantOrganizationsInput
    upsert?: OrganizationUpsertWithoutConsultantOrganizationsInput
    connect?: OrganizationWhereUniqueInput
    update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutConsultantOrganizationsInput, OrganizationUpdateWithoutConsultantOrganizationsInput>, OrganizationUncheckedUpdateWithoutConsultantOrganizationsInput>
  }

  export type OrganizationCreateNestedOneWithoutTicketsInput = {
    create?: XOR<OrganizationCreateWithoutTicketsInput, OrganizationUncheckedCreateWithoutTicketsInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutTicketsInput
    connect?: OrganizationWhereUniqueInput
  }

  export type TicketingUserCreateNestedOneWithoutCreatedTicketsInput = {
    create?: XOR<TicketingUserCreateWithoutCreatedTicketsInput, TicketingUserUncheckedCreateWithoutCreatedTicketsInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutCreatedTicketsInput
    connect?: TicketingUserWhereUniqueInput
  }

  export type TicketingUserCreateNestedOneWithoutAssignedTicketsInput = {
    create?: XOR<TicketingUserCreateWithoutAssignedTicketsInput, TicketingUserUncheckedCreateWithoutAssignedTicketsInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutAssignedTicketsInput
    connect?: TicketingUserWhereUniqueInput
  }

  export type TicketMessageCreateNestedManyWithoutTicketInput = {
    create?: XOR<TicketMessageCreateWithoutTicketInput, TicketMessageUncheckedCreateWithoutTicketInput> | TicketMessageCreateWithoutTicketInput[] | TicketMessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketMessageCreateOrConnectWithoutTicketInput | TicketMessageCreateOrConnectWithoutTicketInput[]
    createMany?: TicketMessageCreateManyTicketInputEnvelope
    connect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
  }

  export type TicketAttachmentCreateNestedManyWithoutTicketInput = {
    create?: XOR<TicketAttachmentCreateWithoutTicketInput, TicketAttachmentUncheckedCreateWithoutTicketInput> | TicketAttachmentCreateWithoutTicketInput[] | TicketAttachmentUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketAttachmentCreateOrConnectWithoutTicketInput | TicketAttachmentCreateOrConnectWithoutTicketInput[]
    createMany?: TicketAttachmentCreateManyTicketInputEnvelope
    connect?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
  }

  export type TicketAuditLogCreateNestedManyWithoutTicketInput = {
    create?: XOR<TicketAuditLogCreateWithoutTicketInput, TicketAuditLogUncheckedCreateWithoutTicketInput> | TicketAuditLogCreateWithoutTicketInput[] | TicketAuditLogUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketAuditLogCreateOrConnectWithoutTicketInput | TicketAuditLogCreateOrConnectWithoutTicketInput[]
    createMany?: TicketAuditLogCreateManyTicketInputEnvelope
    connect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
  }

  export type TicketMessageUncheckedCreateNestedManyWithoutTicketInput = {
    create?: XOR<TicketMessageCreateWithoutTicketInput, TicketMessageUncheckedCreateWithoutTicketInput> | TicketMessageCreateWithoutTicketInput[] | TicketMessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketMessageCreateOrConnectWithoutTicketInput | TicketMessageCreateOrConnectWithoutTicketInput[]
    createMany?: TicketMessageCreateManyTicketInputEnvelope
    connect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
  }

  export type TicketAttachmentUncheckedCreateNestedManyWithoutTicketInput = {
    create?: XOR<TicketAttachmentCreateWithoutTicketInput, TicketAttachmentUncheckedCreateWithoutTicketInput> | TicketAttachmentCreateWithoutTicketInput[] | TicketAttachmentUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketAttachmentCreateOrConnectWithoutTicketInput | TicketAttachmentCreateOrConnectWithoutTicketInput[]
    createMany?: TicketAttachmentCreateManyTicketInputEnvelope
    connect?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
  }

  export type TicketAuditLogUncheckedCreateNestedManyWithoutTicketInput = {
    create?: XOR<TicketAuditLogCreateWithoutTicketInput, TicketAuditLogUncheckedCreateWithoutTicketInput> | TicketAuditLogCreateWithoutTicketInput[] | TicketAuditLogUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketAuditLogCreateOrConnectWithoutTicketInput | TicketAuditLogCreateOrConnectWithoutTicketInput[]
    createMany?: TicketAuditLogCreateManyTicketInputEnvelope
    connect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
  }

  export type EnumTicketTypeFieldUpdateOperationsInput = {
    set?: $Enums.TicketType
  }

  export type EnumTicketPriorityFieldUpdateOperationsInput = {
    set?: $Enums.TicketPriority
  }

  export type EnumTicketStatusFieldUpdateOperationsInput = {
    set?: $Enums.TicketStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type OrganizationUpdateOneRequiredWithoutTicketsNestedInput = {
    create?: XOR<OrganizationCreateWithoutTicketsInput, OrganizationUncheckedCreateWithoutTicketsInput>
    connectOrCreate?: OrganizationCreateOrConnectWithoutTicketsInput
    upsert?: OrganizationUpsertWithoutTicketsInput
    connect?: OrganizationWhereUniqueInput
    update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutTicketsInput, OrganizationUpdateWithoutTicketsInput>, OrganizationUncheckedUpdateWithoutTicketsInput>
  }

  export type TicketingUserUpdateOneRequiredWithoutCreatedTicketsNestedInput = {
    create?: XOR<TicketingUserCreateWithoutCreatedTicketsInput, TicketingUserUncheckedCreateWithoutCreatedTicketsInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutCreatedTicketsInput
    upsert?: TicketingUserUpsertWithoutCreatedTicketsInput
    connect?: TicketingUserWhereUniqueInput
    update?: XOR<XOR<TicketingUserUpdateToOneWithWhereWithoutCreatedTicketsInput, TicketingUserUpdateWithoutCreatedTicketsInput>, TicketingUserUncheckedUpdateWithoutCreatedTicketsInput>
  }

  export type TicketingUserUpdateOneWithoutAssignedTicketsNestedInput = {
    create?: XOR<TicketingUserCreateWithoutAssignedTicketsInput, TicketingUserUncheckedCreateWithoutAssignedTicketsInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutAssignedTicketsInput
    upsert?: TicketingUserUpsertWithoutAssignedTicketsInput
    disconnect?: TicketingUserWhereInput | boolean
    delete?: TicketingUserWhereInput | boolean
    connect?: TicketingUserWhereUniqueInput
    update?: XOR<XOR<TicketingUserUpdateToOneWithWhereWithoutAssignedTicketsInput, TicketingUserUpdateWithoutAssignedTicketsInput>, TicketingUserUncheckedUpdateWithoutAssignedTicketsInput>
  }

  export type TicketMessageUpdateManyWithoutTicketNestedInput = {
    create?: XOR<TicketMessageCreateWithoutTicketInput, TicketMessageUncheckedCreateWithoutTicketInput> | TicketMessageCreateWithoutTicketInput[] | TicketMessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketMessageCreateOrConnectWithoutTicketInput | TicketMessageCreateOrConnectWithoutTicketInput[]
    upsert?: TicketMessageUpsertWithWhereUniqueWithoutTicketInput | TicketMessageUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: TicketMessageCreateManyTicketInputEnvelope
    set?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    disconnect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    delete?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    connect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    update?: TicketMessageUpdateWithWhereUniqueWithoutTicketInput | TicketMessageUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: TicketMessageUpdateManyWithWhereWithoutTicketInput | TicketMessageUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: TicketMessageScalarWhereInput | TicketMessageScalarWhereInput[]
  }

  export type TicketAttachmentUpdateManyWithoutTicketNestedInput = {
    create?: XOR<TicketAttachmentCreateWithoutTicketInput, TicketAttachmentUncheckedCreateWithoutTicketInput> | TicketAttachmentCreateWithoutTicketInput[] | TicketAttachmentUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketAttachmentCreateOrConnectWithoutTicketInput | TicketAttachmentCreateOrConnectWithoutTicketInput[]
    upsert?: TicketAttachmentUpsertWithWhereUniqueWithoutTicketInput | TicketAttachmentUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: TicketAttachmentCreateManyTicketInputEnvelope
    set?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
    disconnect?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
    delete?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
    connect?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
    update?: TicketAttachmentUpdateWithWhereUniqueWithoutTicketInput | TicketAttachmentUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: TicketAttachmentUpdateManyWithWhereWithoutTicketInput | TicketAttachmentUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: TicketAttachmentScalarWhereInput | TicketAttachmentScalarWhereInput[]
  }

  export type TicketAuditLogUpdateManyWithoutTicketNestedInput = {
    create?: XOR<TicketAuditLogCreateWithoutTicketInput, TicketAuditLogUncheckedCreateWithoutTicketInput> | TicketAuditLogCreateWithoutTicketInput[] | TicketAuditLogUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketAuditLogCreateOrConnectWithoutTicketInput | TicketAuditLogCreateOrConnectWithoutTicketInput[]
    upsert?: TicketAuditLogUpsertWithWhereUniqueWithoutTicketInput | TicketAuditLogUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: TicketAuditLogCreateManyTicketInputEnvelope
    set?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    disconnect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    delete?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    connect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    update?: TicketAuditLogUpdateWithWhereUniqueWithoutTicketInput | TicketAuditLogUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: TicketAuditLogUpdateManyWithWhereWithoutTicketInput | TicketAuditLogUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: TicketAuditLogScalarWhereInput | TicketAuditLogScalarWhereInput[]
  }

  export type TicketMessageUncheckedUpdateManyWithoutTicketNestedInput = {
    create?: XOR<TicketMessageCreateWithoutTicketInput, TicketMessageUncheckedCreateWithoutTicketInput> | TicketMessageCreateWithoutTicketInput[] | TicketMessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketMessageCreateOrConnectWithoutTicketInput | TicketMessageCreateOrConnectWithoutTicketInput[]
    upsert?: TicketMessageUpsertWithWhereUniqueWithoutTicketInput | TicketMessageUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: TicketMessageCreateManyTicketInputEnvelope
    set?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    disconnect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    delete?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    connect?: TicketMessageWhereUniqueInput | TicketMessageWhereUniqueInput[]
    update?: TicketMessageUpdateWithWhereUniqueWithoutTicketInput | TicketMessageUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: TicketMessageUpdateManyWithWhereWithoutTicketInput | TicketMessageUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: TicketMessageScalarWhereInput | TicketMessageScalarWhereInput[]
  }

  export type TicketAttachmentUncheckedUpdateManyWithoutTicketNestedInput = {
    create?: XOR<TicketAttachmentCreateWithoutTicketInput, TicketAttachmentUncheckedCreateWithoutTicketInput> | TicketAttachmentCreateWithoutTicketInput[] | TicketAttachmentUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketAttachmentCreateOrConnectWithoutTicketInput | TicketAttachmentCreateOrConnectWithoutTicketInput[]
    upsert?: TicketAttachmentUpsertWithWhereUniqueWithoutTicketInput | TicketAttachmentUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: TicketAttachmentCreateManyTicketInputEnvelope
    set?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
    disconnect?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
    delete?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
    connect?: TicketAttachmentWhereUniqueInput | TicketAttachmentWhereUniqueInput[]
    update?: TicketAttachmentUpdateWithWhereUniqueWithoutTicketInput | TicketAttachmentUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: TicketAttachmentUpdateManyWithWhereWithoutTicketInput | TicketAttachmentUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: TicketAttachmentScalarWhereInput | TicketAttachmentScalarWhereInput[]
  }

  export type TicketAuditLogUncheckedUpdateManyWithoutTicketNestedInput = {
    create?: XOR<TicketAuditLogCreateWithoutTicketInput, TicketAuditLogUncheckedCreateWithoutTicketInput> | TicketAuditLogCreateWithoutTicketInput[] | TicketAuditLogUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: TicketAuditLogCreateOrConnectWithoutTicketInput | TicketAuditLogCreateOrConnectWithoutTicketInput[]
    upsert?: TicketAuditLogUpsertWithWhereUniqueWithoutTicketInput | TicketAuditLogUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: TicketAuditLogCreateManyTicketInputEnvelope
    set?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    disconnect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    delete?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    connect?: TicketAuditLogWhereUniqueInput | TicketAuditLogWhereUniqueInput[]
    update?: TicketAuditLogUpdateWithWhereUniqueWithoutTicketInput | TicketAuditLogUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: TicketAuditLogUpdateManyWithWhereWithoutTicketInput | TicketAuditLogUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: TicketAuditLogScalarWhereInput | TicketAuditLogScalarWhereInput[]
  }

  export type TicketCreateNestedOneWithoutMessagesInput = {
    create?: XOR<TicketCreateWithoutMessagesInput, TicketUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: TicketCreateOrConnectWithoutMessagesInput
    connect?: TicketWhereUniqueInput
  }

  export type TicketingUserCreateNestedOneWithoutMessagesInput = {
    create?: XOR<TicketingUserCreateWithoutMessagesInput, TicketingUserUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutMessagesInput
    connect?: TicketingUserWhereUniqueInput
  }

  export type TicketUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<TicketCreateWithoutMessagesInput, TicketUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: TicketCreateOrConnectWithoutMessagesInput
    upsert?: TicketUpsertWithoutMessagesInput
    connect?: TicketWhereUniqueInput
    update?: XOR<XOR<TicketUpdateToOneWithWhereWithoutMessagesInput, TicketUpdateWithoutMessagesInput>, TicketUncheckedUpdateWithoutMessagesInput>
  }

  export type TicketingUserUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<TicketingUserCreateWithoutMessagesInput, TicketingUserUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutMessagesInput
    upsert?: TicketingUserUpsertWithoutMessagesInput
    connect?: TicketingUserWhereUniqueInput
    update?: XOR<XOR<TicketingUserUpdateToOneWithWhereWithoutMessagesInput, TicketingUserUpdateWithoutMessagesInput>, TicketingUserUncheckedUpdateWithoutMessagesInput>
  }

  export type TicketCreateNestedOneWithoutAttachmentsInput = {
    create?: XOR<TicketCreateWithoutAttachmentsInput, TicketUncheckedCreateWithoutAttachmentsInput>
    connectOrCreate?: TicketCreateOrConnectWithoutAttachmentsInput
    connect?: TicketWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type TicketUpdateOneRequiredWithoutAttachmentsNestedInput = {
    create?: XOR<TicketCreateWithoutAttachmentsInput, TicketUncheckedCreateWithoutAttachmentsInput>
    connectOrCreate?: TicketCreateOrConnectWithoutAttachmentsInput
    upsert?: TicketUpsertWithoutAttachmentsInput
    connect?: TicketWhereUniqueInput
    update?: XOR<XOR<TicketUpdateToOneWithWhereWithoutAttachmentsInput, TicketUpdateWithoutAttachmentsInput>, TicketUncheckedUpdateWithoutAttachmentsInput>
  }

  export type TicketCreateNestedOneWithoutAuditLogsInput = {
    create?: XOR<TicketCreateWithoutAuditLogsInput, TicketUncheckedCreateWithoutAuditLogsInput>
    connectOrCreate?: TicketCreateOrConnectWithoutAuditLogsInput
    connect?: TicketWhereUniqueInput
  }

  export type TicketingUserCreateNestedOneWithoutAuditLogsInput = {
    create?: XOR<TicketingUserCreateWithoutAuditLogsInput, TicketingUserUncheckedCreateWithoutAuditLogsInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutAuditLogsInput
    connect?: TicketingUserWhereUniqueInput
  }

  export type TicketUpdateOneRequiredWithoutAuditLogsNestedInput = {
    create?: XOR<TicketCreateWithoutAuditLogsInput, TicketUncheckedCreateWithoutAuditLogsInput>
    connectOrCreate?: TicketCreateOrConnectWithoutAuditLogsInput
    upsert?: TicketUpsertWithoutAuditLogsInput
    connect?: TicketWhereUniqueInput
    update?: XOR<XOR<TicketUpdateToOneWithWhereWithoutAuditLogsInput, TicketUpdateWithoutAuditLogsInput>, TicketUncheckedUpdateWithoutAuditLogsInput>
  }

  export type TicketingUserUpdateOneWithoutAuditLogsNestedInput = {
    create?: XOR<TicketingUserCreateWithoutAuditLogsInput, TicketingUserUncheckedCreateWithoutAuditLogsInput>
    connectOrCreate?: TicketingUserCreateOrConnectWithoutAuditLogsInput
    upsert?: TicketingUserUpsertWithoutAuditLogsInput
    disconnect?: TicketingUserWhereInput | boolean
    delete?: TicketingUserWhereInput | boolean
    connect?: TicketingUserWhereUniqueInput
    update?: XOR<XOR<TicketingUserUpdateToOneWithWhereWithoutAuditLogsInput, TicketingUserUpdateWithoutAuditLogsInput>, TicketingUserUncheckedUpdateWithoutAuditLogsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumTicketingUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketingUserRole | EnumTicketingUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.TicketingUserRole[] | ListEnumTicketingUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketingUserRole[] | ListEnumTicketingUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketingUserRoleFilter<$PrismaModel> | $Enums.TicketingUserRole
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumTicketingUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketingUserRole | EnumTicketingUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.TicketingUserRole[] | ListEnumTicketingUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketingUserRole[] | ListEnumTicketingUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketingUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.TicketingUserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketingUserRoleFilter<$PrismaModel>
    _max?: NestedEnumTicketingUserRoleFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumTicketTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketType | EnumTicketTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TicketType[] | ListEnumTicketTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketType[] | ListEnumTicketTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketTypeFilter<$PrismaModel> | $Enums.TicketType
  }

  export type NestedEnumTicketPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketPriority | EnumTicketPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.TicketPriority[] | ListEnumTicketPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketPriority[] | ListEnumTicketPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketPriorityFilter<$PrismaModel> | $Enums.TicketPriority
  }

  export type NestedEnumTicketStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketStatus | EnumTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TicketStatus[] | ListEnumTicketStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketStatus[] | ListEnumTicketStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketStatusFilter<$PrismaModel> | $Enums.TicketStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumTicketTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketType | EnumTicketTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TicketType[] | ListEnumTicketTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketType[] | ListEnumTicketTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketTypeWithAggregatesFilter<$PrismaModel> | $Enums.TicketType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketTypeFilter<$PrismaModel>
    _max?: NestedEnumTicketTypeFilter<$PrismaModel>
  }

  export type NestedEnumTicketPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketPriority | EnumTicketPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.TicketPriority[] | ListEnumTicketPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketPriority[] | ListEnumTicketPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketPriorityWithAggregatesFilter<$PrismaModel> | $Enums.TicketPriority
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketPriorityFilter<$PrismaModel>
    _max?: NestedEnumTicketPriorityFilter<$PrismaModel>
  }

  export type NestedEnumTicketStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketStatus | EnumTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TicketStatus[] | ListEnumTicketStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TicketStatus[] | ListEnumTicketStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTicketStatusWithAggregatesFilter<$PrismaModel> | $Enums.TicketStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketStatusFilter<$PrismaModel>
    _max?: NestedEnumTicketStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type TicketingUserCreateWithoutOrganizationInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTickets?: TicketCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserUncheckedCreateWithoutOrganizationInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketUncheckedCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageUncheckedCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserCreateOrConnectWithoutOrganizationInput = {
    where: TicketingUserWhereUniqueInput
    create: XOR<TicketingUserCreateWithoutOrganizationInput, TicketingUserUncheckedCreateWithoutOrganizationInput>
  }

  export type TicketingUserCreateManyOrganizationInputEnvelope = {
    data: TicketingUserCreateManyOrganizationInput | TicketingUserCreateManyOrganizationInput[]
    skipDuplicates?: boolean
  }

  export type TicketCreateWithoutOrganizationInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    createdBy: TicketingUserCreateNestedOneWithoutCreatedTicketsInput
    assignedTo?: TicketingUserCreateNestedOneWithoutAssignedTicketsInput
    messages?: TicketMessageCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutOrganizationInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    messages?: TicketMessageUncheckedCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentUncheckedCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutOrganizationInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutOrganizationInput, TicketUncheckedCreateWithoutOrganizationInput>
  }

  export type TicketCreateManyOrganizationInputEnvelope = {
    data: TicketCreateManyOrganizationInput | TicketCreateManyOrganizationInput[]
    skipDuplicates?: boolean
  }

  export type ConsultantOrganizationCreateWithoutOrganizationInput = {
    id?: string
    createdAt?: Date | string
    consultant: TicketingUserCreateNestedOneWithoutConsultantOrganizationsInput
  }

  export type ConsultantOrganizationUncheckedCreateWithoutOrganizationInput = {
    id?: string
    consultantId: string
    createdAt?: Date | string
  }

  export type ConsultantOrganizationCreateOrConnectWithoutOrganizationInput = {
    where: ConsultantOrganizationWhereUniqueInput
    create: XOR<ConsultantOrganizationCreateWithoutOrganizationInput, ConsultantOrganizationUncheckedCreateWithoutOrganizationInput>
  }

  export type ConsultantOrganizationCreateManyOrganizationInputEnvelope = {
    data: ConsultantOrganizationCreateManyOrganizationInput | ConsultantOrganizationCreateManyOrganizationInput[]
    skipDuplicates?: boolean
  }

  export type TicketingUserUpsertWithWhereUniqueWithoutOrganizationInput = {
    where: TicketingUserWhereUniqueInput
    update: XOR<TicketingUserUpdateWithoutOrganizationInput, TicketingUserUncheckedUpdateWithoutOrganizationInput>
    create: XOR<TicketingUserCreateWithoutOrganizationInput, TicketingUserUncheckedCreateWithoutOrganizationInput>
  }

  export type TicketingUserUpdateWithWhereUniqueWithoutOrganizationInput = {
    where: TicketingUserWhereUniqueInput
    data: XOR<TicketingUserUpdateWithoutOrganizationInput, TicketingUserUncheckedUpdateWithoutOrganizationInput>
  }

  export type TicketingUserUpdateManyWithWhereWithoutOrganizationInput = {
    where: TicketingUserScalarWhereInput
    data: XOR<TicketingUserUpdateManyMutationInput, TicketingUserUncheckedUpdateManyWithoutOrganizationInput>
  }

  export type TicketingUserScalarWhereInput = {
    AND?: TicketingUserScalarWhereInput | TicketingUserScalarWhereInput[]
    OR?: TicketingUserScalarWhereInput[]
    NOT?: TicketingUserScalarWhereInput | TicketingUserScalarWhereInput[]
    id?: StringFilter<"TicketingUser"> | string
    email?: StringFilter<"TicketingUser"> | string
    passwordHash?: StringFilter<"TicketingUser"> | string
    name?: StringFilter<"TicketingUser"> | string
    role?: EnumTicketingUserRoleFilter<"TicketingUser"> | $Enums.TicketingUserRole
    organizationId?: StringNullableFilter<"TicketingUser"> | string | null
    consultantVerified?: BoolFilter<"TicketingUser"> | boolean
    tbosAdminUserId?: StringNullableFilter<"TicketingUser"> | string | null
    tbosRole?: StringNullableFilter<"TicketingUser"> | string | null
    active?: BoolFilter<"TicketingUser"> | boolean
    createdAt?: DateTimeFilter<"TicketingUser"> | Date | string
    updatedAt?: DateTimeFilter<"TicketingUser"> | Date | string
  }

  export type TicketUpsertWithWhereUniqueWithoutOrganizationInput = {
    where: TicketWhereUniqueInput
    update: XOR<TicketUpdateWithoutOrganizationInput, TicketUncheckedUpdateWithoutOrganizationInput>
    create: XOR<TicketCreateWithoutOrganizationInput, TicketUncheckedCreateWithoutOrganizationInput>
  }

  export type TicketUpdateWithWhereUniqueWithoutOrganizationInput = {
    where: TicketWhereUniqueInput
    data: XOR<TicketUpdateWithoutOrganizationInput, TicketUncheckedUpdateWithoutOrganizationInput>
  }

  export type TicketUpdateManyWithWhereWithoutOrganizationInput = {
    where: TicketScalarWhereInput
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyWithoutOrganizationInput>
  }

  export type TicketScalarWhereInput = {
    AND?: TicketScalarWhereInput | TicketScalarWhereInput[]
    OR?: TicketScalarWhereInput[]
    NOT?: TicketScalarWhereInput | TicketScalarWhereInput[]
    id?: StringFilter<"Ticket"> | string
    ticketNumber?: StringFilter<"Ticket"> | string
    organizationId?: StringFilter<"Ticket"> | string
    type?: EnumTicketTypeFilter<"Ticket"> | $Enums.TicketType
    priority?: EnumTicketPriorityFilter<"Ticket"> | $Enums.TicketPriority
    status?: EnumTicketStatusFilter<"Ticket"> | $Enums.TicketStatus
    subject?: StringFilter<"Ticket"> | string
    description?: StringFilter<"Ticket"> | string
    createdById?: StringFilter<"Ticket"> | string
    assignedToId?: StringNullableFilter<"Ticket"> | string | null
    createdAt?: DateTimeFilter<"Ticket"> | Date | string
    updatedAt?: DateTimeFilter<"Ticket"> | Date | string
    closedAt?: DateTimeNullableFilter<"Ticket"> | Date | string | null
  }

  export type ConsultantOrganizationUpsertWithWhereUniqueWithoutOrganizationInput = {
    where: ConsultantOrganizationWhereUniqueInput
    update: XOR<ConsultantOrganizationUpdateWithoutOrganizationInput, ConsultantOrganizationUncheckedUpdateWithoutOrganizationInput>
    create: XOR<ConsultantOrganizationCreateWithoutOrganizationInput, ConsultantOrganizationUncheckedCreateWithoutOrganizationInput>
  }

  export type ConsultantOrganizationUpdateWithWhereUniqueWithoutOrganizationInput = {
    where: ConsultantOrganizationWhereUniqueInput
    data: XOR<ConsultantOrganizationUpdateWithoutOrganizationInput, ConsultantOrganizationUncheckedUpdateWithoutOrganizationInput>
  }

  export type ConsultantOrganizationUpdateManyWithWhereWithoutOrganizationInput = {
    where: ConsultantOrganizationScalarWhereInput
    data: XOR<ConsultantOrganizationUpdateManyMutationInput, ConsultantOrganizationUncheckedUpdateManyWithoutOrganizationInput>
  }

  export type ConsultantOrganizationScalarWhereInput = {
    AND?: ConsultantOrganizationScalarWhereInput | ConsultantOrganizationScalarWhereInput[]
    OR?: ConsultantOrganizationScalarWhereInput[]
    NOT?: ConsultantOrganizationScalarWhereInput | ConsultantOrganizationScalarWhereInput[]
    id?: StringFilter<"ConsultantOrganization"> | string
    consultantId?: StringFilter<"ConsultantOrganization"> | string
    organizationId?: StringFilter<"ConsultantOrganization"> | string
    createdAt?: DateTimeFilter<"ConsultantOrganization"> | Date | string
  }

  export type OrganizationCreateWithoutUsersInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    tickets?: TicketCreateNestedManyWithoutOrganizationInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUncheckedCreateWithoutUsersInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    tickets?: TicketUncheckedCreateNestedManyWithoutOrganizationInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationCreateOrConnectWithoutUsersInput = {
    where: OrganizationWhereUniqueInput
    create: XOR<OrganizationCreateWithoutUsersInput, OrganizationUncheckedCreateWithoutUsersInput>
  }

  export type TicketCreateWithoutCreatedByInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    organization: OrganizationCreateNestedOneWithoutTicketsInput
    assignedTo?: TicketingUserCreateNestedOneWithoutAssignedTicketsInput
    messages?: TicketMessageCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutCreatedByInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    messages?: TicketMessageUncheckedCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentUncheckedCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutCreatedByInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutCreatedByInput, TicketUncheckedCreateWithoutCreatedByInput>
  }

  export type TicketCreateManyCreatedByInputEnvelope = {
    data: TicketCreateManyCreatedByInput | TicketCreateManyCreatedByInput[]
    skipDuplicates?: boolean
  }

  export type TicketCreateWithoutAssignedToInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    organization: OrganizationCreateNestedOneWithoutTicketsInput
    createdBy: TicketingUserCreateNestedOneWithoutCreatedTicketsInput
    messages?: TicketMessageCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutAssignedToInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    messages?: TicketMessageUncheckedCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentUncheckedCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutAssignedToInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutAssignedToInput, TicketUncheckedCreateWithoutAssignedToInput>
  }

  export type TicketCreateManyAssignedToInputEnvelope = {
    data: TicketCreateManyAssignedToInput | TicketCreateManyAssignedToInput[]
    skipDuplicates?: boolean
  }

  export type TicketMessageCreateWithoutAuthorInput = {
    id?: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
    ticket: TicketCreateNestedOneWithoutMessagesInput
  }

  export type TicketMessageUncheckedCreateWithoutAuthorInput = {
    id?: string
    ticketId: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type TicketMessageCreateOrConnectWithoutAuthorInput = {
    where: TicketMessageWhereUniqueInput
    create: XOR<TicketMessageCreateWithoutAuthorInput, TicketMessageUncheckedCreateWithoutAuthorInput>
  }

  export type TicketMessageCreateManyAuthorInputEnvelope = {
    data: TicketMessageCreateManyAuthorInput | TicketMessageCreateManyAuthorInput[]
    skipDuplicates?: boolean
  }

  export type TicketAuditLogCreateWithoutActorInput = {
    id?: string
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    ticket: TicketCreateNestedOneWithoutAuditLogsInput
  }

  export type TicketAuditLogUncheckedCreateWithoutActorInput = {
    id?: string
    ticketId: string
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type TicketAuditLogCreateOrConnectWithoutActorInput = {
    where: TicketAuditLogWhereUniqueInput
    create: XOR<TicketAuditLogCreateWithoutActorInput, TicketAuditLogUncheckedCreateWithoutActorInput>
  }

  export type TicketAuditLogCreateManyActorInputEnvelope = {
    data: TicketAuditLogCreateManyActorInput | TicketAuditLogCreateManyActorInput[]
    skipDuplicates?: boolean
  }

  export type ConsultantOrganizationCreateWithoutConsultantInput = {
    id?: string
    createdAt?: Date | string
    organization: OrganizationCreateNestedOneWithoutConsultantOrganizationsInput
  }

  export type ConsultantOrganizationUncheckedCreateWithoutConsultantInput = {
    id?: string
    organizationId: string
    createdAt?: Date | string
  }

  export type ConsultantOrganizationCreateOrConnectWithoutConsultantInput = {
    where: ConsultantOrganizationWhereUniqueInput
    create: XOR<ConsultantOrganizationCreateWithoutConsultantInput, ConsultantOrganizationUncheckedCreateWithoutConsultantInput>
  }

  export type ConsultantOrganizationCreateManyConsultantInputEnvelope = {
    data: ConsultantOrganizationCreateManyConsultantInput | ConsultantOrganizationCreateManyConsultantInput[]
    skipDuplicates?: boolean
  }

  export type OrganizationUpsertWithoutUsersInput = {
    update: XOR<OrganizationUpdateWithoutUsersInput, OrganizationUncheckedUpdateWithoutUsersInput>
    create: XOR<OrganizationCreateWithoutUsersInput, OrganizationUncheckedCreateWithoutUsersInput>
    where?: OrganizationWhereInput
  }

  export type OrganizationUpdateToOneWithWhereWithoutUsersInput = {
    where?: OrganizationWhereInput
    data: XOR<OrganizationUpdateWithoutUsersInput, OrganizationUncheckedUpdateWithoutUsersInput>
  }

  export type OrganizationUpdateWithoutUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tickets?: TicketUpdateManyWithoutOrganizationNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationUncheckedUpdateWithoutUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tickets?: TicketUncheckedUpdateManyWithoutOrganizationNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutOrganizationNestedInput
  }

  export type TicketUpsertWithWhereUniqueWithoutCreatedByInput = {
    where: TicketWhereUniqueInput
    update: XOR<TicketUpdateWithoutCreatedByInput, TicketUncheckedUpdateWithoutCreatedByInput>
    create: XOR<TicketCreateWithoutCreatedByInput, TicketUncheckedCreateWithoutCreatedByInput>
  }

  export type TicketUpdateWithWhereUniqueWithoutCreatedByInput = {
    where: TicketWhereUniqueInput
    data: XOR<TicketUpdateWithoutCreatedByInput, TicketUncheckedUpdateWithoutCreatedByInput>
  }

  export type TicketUpdateManyWithWhereWithoutCreatedByInput = {
    where: TicketScalarWhereInput
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyWithoutCreatedByInput>
  }

  export type TicketUpsertWithWhereUniqueWithoutAssignedToInput = {
    where: TicketWhereUniqueInput
    update: XOR<TicketUpdateWithoutAssignedToInput, TicketUncheckedUpdateWithoutAssignedToInput>
    create: XOR<TicketCreateWithoutAssignedToInput, TicketUncheckedCreateWithoutAssignedToInput>
  }

  export type TicketUpdateWithWhereUniqueWithoutAssignedToInput = {
    where: TicketWhereUniqueInput
    data: XOR<TicketUpdateWithoutAssignedToInput, TicketUncheckedUpdateWithoutAssignedToInput>
  }

  export type TicketUpdateManyWithWhereWithoutAssignedToInput = {
    where: TicketScalarWhereInput
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyWithoutAssignedToInput>
  }

  export type TicketMessageUpsertWithWhereUniqueWithoutAuthorInput = {
    where: TicketMessageWhereUniqueInput
    update: XOR<TicketMessageUpdateWithoutAuthorInput, TicketMessageUncheckedUpdateWithoutAuthorInput>
    create: XOR<TicketMessageCreateWithoutAuthorInput, TicketMessageUncheckedCreateWithoutAuthorInput>
  }

  export type TicketMessageUpdateWithWhereUniqueWithoutAuthorInput = {
    where: TicketMessageWhereUniqueInput
    data: XOR<TicketMessageUpdateWithoutAuthorInput, TicketMessageUncheckedUpdateWithoutAuthorInput>
  }

  export type TicketMessageUpdateManyWithWhereWithoutAuthorInput = {
    where: TicketMessageScalarWhereInput
    data: XOR<TicketMessageUpdateManyMutationInput, TicketMessageUncheckedUpdateManyWithoutAuthorInput>
  }

  export type TicketMessageScalarWhereInput = {
    AND?: TicketMessageScalarWhereInput | TicketMessageScalarWhereInput[]
    OR?: TicketMessageScalarWhereInput[]
    NOT?: TicketMessageScalarWhereInput | TicketMessageScalarWhereInput[]
    id?: StringFilter<"TicketMessage"> | string
    ticketId?: StringFilter<"TicketMessage"> | string
    authorId?: StringFilter<"TicketMessage"> | string
    body?: StringFilter<"TicketMessage"> | string
    isInternal?: BoolFilter<"TicketMessage"> | boolean
    createdAt?: DateTimeFilter<"TicketMessage"> | Date | string
  }

  export type TicketAuditLogUpsertWithWhereUniqueWithoutActorInput = {
    where: TicketAuditLogWhereUniqueInput
    update: XOR<TicketAuditLogUpdateWithoutActorInput, TicketAuditLogUncheckedUpdateWithoutActorInput>
    create: XOR<TicketAuditLogCreateWithoutActorInput, TicketAuditLogUncheckedCreateWithoutActorInput>
  }

  export type TicketAuditLogUpdateWithWhereUniqueWithoutActorInput = {
    where: TicketAuditLogWhereUniqueInput
    data: XOR<TicketAuditLogUpdateWithoutActorInput, TicketAuditLogUncheckedUpdateWithoutActorInput>
  }

  export type TicketAuditLogUpdateManyWithWhereWithoutActorInput = {
    where: TicketAuditLogScalarWhereInput
    data: XOR<TicketAuditLogUpdateManyMutationInput, TicketAuditLogUncheckedUpdateManyWithoutActorInput>
  }

  export type TicketAuditLogScalarWhereInput = {
    AND?: TicketAuditLogScalarWhereInput | TicketAuditLogScalarWhereInput[]
    OR?: TicketAuditLogScalarWhereInput[]
    NOT?: TicketAuditLogScalarWhereInput | TicketAuditLogScalarWhereInput[]
    id?: StringFilter<"TicketAuditLog"> | string
    ticketId?: StringFilter<"TicketAuditLog"> | string
    actorId?: StringNullableFilter<"TicketAuditLog"> | string | null
    action?: StringFilter<"TicketAuditLog"> | string
    field?: StringNullableFilter<"TicketAuditLog"> | string | null
    oldValue?: StringNullableFilter<"TicketAuditLog"> | string | null
    newValue?: StringNullableFilter<"TicketAuditLog"> | string | null
    metadata?: JsonNullableFilter<"TicketAuditLog">
    createdAt?: DateTimeFilter<"TicketAuditLog"> | Date | string
  }

  export type ConsultantOrganizationUpsertWithWhereUniqueWithoutConsultantInput = {
    where: ConsultantOrganizationWhereUniqueInput
    update: XOR<ConsultantOrganizationUpdateWithoutConsultantInput, ConsultantOrganizationUncheckedUpdateWithoutConsultantInput>
    create: XOR<ConsultantOrganizationCreateWithoutConsultantInput, ConsultantOrganizationUncheckedCreateWithoutConsultantInput>
  }

  export type ConsultantOrganizationUpdateWithWhereUniqueWithoutConsultantInput = {
    where: ConsultantOrganizationWhereUniqueInput
    data: XOR<ConsultantOrganizationUpdateWithoutConsultantInput, ConsultantOrganizationUncheckedUpdateWithoutConsultantInput>
  }

  export type ConsultantOrganizationUpdateManyWithWhereWithoutConsultantInput = {
    where: ConsultantOrganizationScalarWhereInput
    data: XOR<ConsultantOrganizationUpdateManyMutationInput, ConsultantOrganizationUncheckedUpdateManyWithoutConsultantInput>
  }

  export type TicketingUserCreateWithoutConsultantOrganizationsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    organization?: OrganizationCreateNestedOneWithoutUsersInput
    createdTickets?: TicketCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutActorInput
  }

  export type TicketingUserUncheckedCreateWithoutConsultantOrganizationsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    organizationId?: string | null
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketUncheckedCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageUncheckedCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutActorInput
  }

  export type TicketingUserCreateOrConnectWithoutConsultantOrganizationsInput = {
    where: TicketingUserWhereUniqueInput
    create: XOR<TicketingUserCreateWithoutConsultantOrganizationsInput, TicketingUserUncheckedCreateWithoutConsultantOrganizationsInput>
  }

  export type OrganizationCreateWithoutConsultantOrganizationsInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: TicketingUserCreateNestedManyWithoutOrganizationInput
    tickets?: TicketCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUncheckedCreateWithoutConsultantOrganizationsInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: TicketingUserUncheckedCreateNestedManyWithoutOrganizationInput
    tickets?: TicketUncheckedCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationCreateOrConnectWithoutConsultantOrganizationsInput = {
    where: OrganizationWhereUniqueInput
    create: XOR<OrganizationCreateWithoutConsultantOrganizationsInput, OrganizationUncheckedCreateWithoutConsultantOrganizationsInput>
  }

  export type TicketingUserUpsertWithoutConsultantOrganizationsInput = {
    update: XOR<TicketingUserUpdateWithoutConsultantOrganizationsInput, TicketingUserUncheckedUpdateWithoutConsultantOrganizationsInput>
    create: XOR<TicketingUserCreateWithoutConsultantOrganizationsInput, TicketingUserUncheckedCreateWithoutConsultantOrganizationsInput>
    where?: TicketingUserWhereInput
  }

  export type TicketingUserUpdateToOneWithWhereWithoutConsultantOrganizationsInput = {
    where?: TicketingUserWhereInput
    data: XOR<TicketingUserUpdateWithoutConsultantOrganizationsInput, TicketingUserUncheckedUpdateWithoutConsultantOrganizationsInput>
  }

  export type TicketingUserUpdateWithoutConsultantOrganizationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneWithoutUsersNestedInput
    createdTickets?: TicketUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutActorNestedInput
  }

  export type TicketingUserUncheckedUpdateWithoutConsultantOrganizationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUncheckedUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUncheckedUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutActorNestedInput
  }

  export type OrganizationUpsertWithoutConsultantOrganizationsInput = {
    update: XOR<OrganizationUpdateWithoutConsultantOrganizationsInput, OrganizationUncheckedUpdateWithoutConsultantOrganizationsInput>
    create: XOR<OrganizationCreateWithoutConsultantOrganizationsInput, OrganizationUncheckedCreateWithoutConsultantOrganizationsInput>
    where?: OrganizationWhereInput
  }

  export type OrganizationUpdateToOneWithWhereWithoutConsultantOrganizationsInput = {
    where?: OrganizationWhereInput
    data: XOR<OrganizationUpdateWithoutConsultantOrganizationsInput, OrganizationUncheckedUpdateWithoutConsultantOrganizationsInput>
  }

  export type OrganizationUpdateWithoutConsultantOrganizationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: TicketingUserUpdateManyWithoutOrganizationNestedInput
    tickets?: TicketUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationUncheckedUpdateWithoutConsultantOrganizationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: TicketingUserUncheckedUpdateManyWithoutOrganizationNestedInput
    tickets?: TicketUncheckedUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationCreateWithoutTicketsInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: TicketingUserCreateNestedManyWithoutOrganizationInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationUncheckedCreateWithoutTicketsInput = {
    id?: string
    name: string
    slug: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: TicketingUserUncheckedCreateNestedManyWithoutOrganizationInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutOrganizationInput
  }

  export type OrganizationCreateOrConnectWithoutTicketsInput = {
    where: OrganizationWhereUniqueInput
    create: XOR<OrganizationCreateWithoutTicketsInput, OrganizationUncheckedCreateWithoutTicketsInput>
  }

  export type TicketingUserCreateWithoutCreatedTicketsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    organization?: OrganizationCreateNestedOneWithoutUsersInput
    assignedTickets?: TicketCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserUncheckedCreateWithoutCreatedTicketsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    organizationId?: string | null
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    assignedTickets?: TicketUncheckedCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageUncheckedCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserCreateOrConnectWithoutCreatedTicketsInput = {
    where: TicketingUserWhereUniqueInput
    create: XOR<TicketingUserCreateWithoutCreatedTicketsInput, TicketingUserUncheckedCreateWithoutCreatedTicketsInput>
  }

  export type TicketingUserCreateWithoutAssignedTicketsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    organization?: OrganizationCreateNestedOneWithoutUsersInput
    createdTickets?: TicketCreateNestedManyWithoutCreatedByInput
    messages?: TicketMessageCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserUncheckedCreateWithoutAssignedTicketsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    organizationId?: string | null
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByInput
    messages?: TicketMessageUncheckedCreateNestedManyWithoutAuthorInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserCreateOrConnectWithoutAssignedTicketsInput = {
    where: TicketingUserWhereUniqueInput
    create: XOR<TicketingUserCreateWithoutAssignedTicketsInput, TicketingUserUncheckedCreateWithoutAssignedTicketsInput>
  }

  export type TicketMessageCreateWithoutTicketInput = {
    id?: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
    author: TicketingUserCreateNestedOneWithoutMessagesInput
  }

  export type TicketMessageUncheckedCreateWithoutTicketInput = {
    id?: string
    authorId: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type TicketMessageCreateOrConnectWithoutTicketInput = {
    where: TicketMessageWhereUniqueInput
    create: XOR<TicketMessageCreateWithoutTicketInput, TicketMessageUncheckedCreateWithoutTicketInput>
  }

  export type TicketMessageCreateManyTicketInputEnvelope = {
    data: TicketMessageCreateManyTicketInput | TicketMessageCreateManyTicketInput[]
    skipDuplicates?: boolean
  }

  export type TicketAttachmentCreateWithoutTicketInput = {
    id?: string
    fileName: string
    fileUrl: string
    fileSize?: number | null
    uploadedById: string
    createdAt?: Date | string
  }

  export type TicketAttachmentUncheckedCreateWithoutTicketInput = {
    id?: string
    fileName: string
    fileUrl: string
    fileSize?: number | null
    uploadedById: string
    createdAt?: Date | string
  }

  export type TicketAttachmentCreateOrConnectWithoutTicketInput = {
    where: TicketAttachmentWhereUniqueInput
    create: XOR<TicketAttachmentCreateWithoutTicketInput, TicketAttachmentUncheckedCreateWithoutTicketInput>
  }

  export type TicketAttachmentCreateManyTicketInputEnvelope = {
    data: TicketAttachmentCreateManyTicketInput | TicketAttachmentCreateManyTicketInput[]
    skipDuplicates?: boolean
  }

  export type TicketAuditLogCreateWithoutTicketInput = {
    id?: string
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    actor?: TicketingUserCreateNestedOneWithoutAuditLogsInput
  }

  export type TicketAuditLogUncheckedCreateWithoutTicketInput = {
    id?: string
    actorId?: string | null
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type TicketAuditLogCreateOrConnectWithoutTicketInput = {
    where: TicketAuditLogWhereUniqueInput
    create: XOR<TicketAuditLogCreateWithoutTicketInput, TicketAuditLogUncheckedCreateWithoutTicketInput>
  }

  export type TicketAuditLogCreateManyTicketInputEnvelope = {
    data: TicketAuditLogCreateManyTicketInput | TicketAuditLogCreateManyTicketInput[]
    skipDuplicates?: boolean
  }

  export type OrganizationUpsertWithoutTicketsInput = {
    update: XOR<OrganizationUpdateWithoutTicketsInput, OrganizationUncheckedUpdateWithoutTicketsInput>
    create: XOR<OrganizationCreateWithoutTicketsInput, OrganizationUncheckedCreateWithoutTicketsInput>
    where?: OrganizationWhereInput
  }

  export type OrganizationUpdateToOneWithWhereWithoutTicketsInput = {
    where?: OrganizationWhereInput
    data: XOR<OrganizationUpdateWithoutTicketsInput, OrganizationUncheckedUpdateWithoutTicketsInput>
  }

  export type OrganizationUpdateWithoutTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: TicketingUserUpdateManyWithoutOrganizationNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutOrganizationNestedInput
  }

  export type OrganizationUncheckedUpdateWithoutTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: TicketingUserUncheckedUpdateManyWithoutOrganizationNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutOrganizationNestedInput
  }

  export type TicketingUserUpsertWithoutCreatedTicketsInput = {
    update: XOR<TicketingUserUpdateWithoutCreatedTicketsInput, TicketingUserUncheckedUpdateWithoutCreatedTicketsInput>
    create: XOR<TicketingUserCreateWithoutCreatedTicketsInput, TicketingUserUncheckedCreateWithoutCreatedTicketsInput>
    where?: TicketingUserWhereInput
  }

  export type TicketingUserUpdateToOneWithWhereWithoutCreatedTicketsInput = {
    where?: TicketingUserWhereInput
    data: XOR<TicketingUserUpdateWithoutCreatedTicketsInput, TicketingUserUncheckedUpdateWithoutCreatedTicketsInput>
  }

  export type TicketingUserUpdateWithoutCreatedTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneWithoutUsersNestedInput
    assignedTickets?: TicketUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserUncheckedUpdateWithoutCreatedTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assignedTickets?: TicketUncheckedUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUncheckedUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserUpsertWithoutAssignedTicketsInput = {
    update: XOR<TicketingUserUpdateWithoutAssignedTicketsInput, TicketingUserUncheckedUpdateWithoutAssignedTicketsInput>
    create: XOR<TicketingUserCreateWithoutAssignedTicketsInput, TicketingUserUncheckedCreateWithoutAssignedTicketsInput>
    where?: TicketingUserWhereInput
  }

  export type TicketingUserUpdateToOneWithWhereWithoutAssignedTicketsInput = {
    where?: TicketingUserWhereInput
    data: XOR<TicketingUserUpdateWithoutAssignedTicketsInput, TicketingUserUncheckedUpdateWithoutAssignedTicketsInput>
  }

  export type TicketingUserUpdateWithoutAssignedTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneWithoutUsersNestedInput
    createdTickets?: TicketUpdateManyWithoutCreatedByNestedInput
    messages?: TicketMessageUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserUncheckedUpdateWithoutAssignedTicketsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByNestedInput
    messages?: TicketMessageUncheckedUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutConsultantNestedInput
  }

  export type TicketMessageUpsertWithWhereUniqueWithoutTicketInput = {
    where: TicketMessageWhereUniqueInput
    update: XOR<TicketMessageUpdateWithoutTicketInput, TicketMessageUncheckedUpdateWithoutTicketInput>
    create: XOR<TicketMessageCreateWithoutTicketInput, TicketMessageUncheckedCreateWithoutTicketInput>
  }

  export type TicketMessageUpdateWithWhereUniqueWithoutTicketInput = {
    where: TicketMessageWhereUniqueInput
    data: XOR<TicketMessageUpdateWithoutTicketInput, TicketMessageUncheckedUpdateWithoutTicketInput>
  }

  export type TicketMessageUpdateManyWithWhereWithoutTicketInput = {
    where: TicketMessageScalarWhereInput
    data: XOR<TicketMessageUpdateManyMutationInput, TicketMessageUncheckedUpdateManyWithoutTicketInput>
  }

  export type TicketAttachmentUpsertWithWhereUniqueWithoutTicketInput = {
    where: TicketAttachmentWhereUniqueInput
    update: XOR<TicketAttachmentUpdateWithoutTicketInput, TicketAttachmentUncheckedUpdateWithoutTicketInput>
    create: XOR<TicketAttachmentCreateWithoutTicketInput, TicketAttachmentUncheckedCreateWithoutTicketInput>
  }

  export type TicketAttachmentUpdateWithWhereUniqueWithoutTicketInput = {
    where: TicketAttachmentWhereUniqueInput
    data: XOR<TicketAttachmentUpdateWithoutTicketInput, TicketAttachmentUncheckedUpdateWithoutTicketInput>
  }

  export type TicketAttachmentUpdateManyWithWhereWithoutTicketInput = {
    where: TicketAttachmentScalarWhereInput
    data: XOR<TicketAttachmentUpdateManyMutationInput, TicketAttachmentUncheckedUpdateManyWithoutTicketInput>
  }

  export type TicketAttachmentScalarWhereInput = {
    AND?: TicketAttachmentScalarWhereInput | TicketAttachmentScalarWhereInput[]
    OR?: TicketAttachmentScalarWhereInput[]
    NOT?: TicketAttachmentScalarWhereInput | TicketAttachmentScalarWhereInput[]
    id?: StringFilter<"TicketAttachment"> | string
    ticketId?: StringFilter<"TicketAttachment"> | string
    fileName?: StringFilter<"TicketAttachment"> | string
    fileUrl?: StringFilter<"TicketAttachment"> | string
    fileSize?: IntNullableFilter<"TicketAttachment"> | number | null
    uploadedById?: StringFilter<"TicketAttachment"> | string
    createdAt?: DateTimeFilter<"TicketAttachment"> | Date | string
  }

  export type TicketAuditLogUpsertWithWhereUniqueWithoutTicketInput = {
    where: TicketAuditLogWhereUniqueInput
    update: XOR<TicketAuditLogUpdateWithoutTicketInput, TicketAuditLogUncheckedUpdateWithoutTicketInput>
    create: XOR<TicketAuditLogCreateWithoutTicketInput, TicketAuditLogUncheckedCreateWithoutTicketInput>
  }

  export type TicketAuditLogUpdateWithWhereUniqueWithoutTicketInput = {
    where: TicketAuditLogWhereUniqueInput
    data: XOR<TicketAuditLogUpdateWithoutTicketInput, TicketAuditLogUncheckedUpdateWithoutTicketInput>
  }

  export type TicketAuditLogUpdateManyWithWhereWithoutTicketInput = {
    where: TicketAuditLogScalarWhereInput
    data: XOR<TicketAuditLogUpdateManyMutationInput, TicketAuditLogUncheckedUpdateManyWithoutTicketInput>
  }

  export type TicketCreateWithoutMessagesInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    organization: OrganizationCreateNestedOneWithoutTicketsInput
    createdBy: TicketingUserCreateNestedOneWithoutCreatedTicketsInput
    assignedTo?: TicketingUserCreateNestedOneWithoutAssignedTicketsInput
    attachments?: TicketAttachmentCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutMessagesInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    attachments?: TicketAttachmentUncheckedCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutMessagesInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutMessagesInput, TicketUncheckedCreateWithoutMessagesInput>
  }

  export type TicketingUserCreateWithoutMessagesInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    organization?: OrganizationCreateNestedOneWithoutUsersInput
    createdTickets?: TicketCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketCreateNestedManyWithoutAssignedToInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserUncheckedCreateWithoutMessagesInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    organizationId?: string | null
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketUncheckedCreateNestedManyWithoutAssignedToInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutActorInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserCreateOrConnectWithoutMessagesInput = {
    where: TicketingUserWhereUniqueInput
    create: XOR<TicketingUserCreateWithoutMessagesInput, TicketingUserUncheckedCreateWithoutMessagesInput>
  }

  export type TicketUpsertWithoutMessagesInput = {
    update: XOR<TicketUpdateWithoutMessagesInput, TicketUncheckedUpdateWithoutMessagesInput>
    create: XOR<TicketCreateWithoutMessagesInput, TicketUncheckedCreateWithoutMessagesInput>
    where?: TicketWhereInput
  }

  export type TicketUpdateToOneWithWhereWithoutMessagesInput = {
    where?: TicketWhereInput
    data: XOR<TicketUpdateWithoutMessagesInput, TicketUncheckedUpdateWithoutMessagesInput>
  }

  export type TicketUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    organization?: OrganizationUpdateOneRequiredWithoutTicketsNestedInput
    createdBy?: TicketingUserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    assignedTo?: TicketingUserUpdateOneWithoutAssignedTicketsNestedInput
    attachments?: TicketAttachmentUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    attachments?: TicketAttachmentUncheckedUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketingUserUpsertWithoutMessagesInput = {
    update: XOR<TicketingUserUpdateWithoutMessagesInput, TicketingUserUncheckedUpdateWithoutMessagesInput>
    create: XOR<TicketingUserCreateWithoutMessagesInput, TicketingUserUncheckedCreateWithoutMessagesInput>
    where?: TicketingUserWhereInput
  }

  export type TicketingUserUpdateToOneWithWhereWithoutMessagesInput = {
    where?: TicketingUserWhereInput
    data: XOR<TicketingUserUpdateWithoutMessagesInput, TicketingUserUncheckedUpdateWithoutMessagesInput>
  }

  export type TicketingUserUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneWithoutUsersNestedInput
    createdTickets?: TicketUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUpdateManyWithoutAssignedToNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUncheckedUpdateManyWithoutAssignedToNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutConsultantNestedInput
  }

  export type TicketCreateWithoutAttachmentsInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    organization: OrganizationCreateNestedOneWithoutTicketsInput
    createdBy: TicketingUserCreateNestedOneWithoutCreatedTicketsInput
    assignedTo?: TicketingUserCreateNestedOneWithoutAssignedTicketsInput
    messages?: TicketMessageCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutAttachmentsInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    messages?: TicketMessageUncheckedCreateNestedManyWithoutTicketInput
    auditLogs?: TicketAuditLogUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutAttachmentsInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutAttachmentsInput, TicketUncheckedCreateWithoutAttachmentsInput>
  }

  export type TicketUpsertWithoutAttachmentsInput = {
    update: XOR<TicketUpdateWithoutAttachmentsInput, TicketUncheckedUpdateWithoutAttachmentsInput>
    create: XOR<TicketCreateWithoutAttachmentsInput, TicketUncheckedCreateWithoutAttachmentsInput>
    where?: TicketWhereInput
  }

  export type TicketUpdateToOneWithWhereWithoutAttachmentsInput = {
    where?: TicketWhereInput
    data: XOR<TicketUpdateWithoutAttachmentsInput, TicketUncheckedUpdateWithoutAttachmentsInput>
  }

  export type TicketUpdateWithoutAttachmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    organization?: OrganizationUpdateOneRequiredWithoutTicketsNestedInput
    createdBy?: TicketingUserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    assignedTo?: TicketingUserUpdateOneWithoutAssignedTicketsNestedInput
    messages?: TicketMessageUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutAttachmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: TicketMessageUncheckedUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketCreateWithoutAuditLogsInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    organization: OrganizationCreateNestedOneWithoutTicketsInput
    createdBy: TicketingUserCreateNestedOneWithoutCreatedTicketsInput
    assignedTo?: TicketingUserCreateNestedOneWithoutAssignedTicketsInput
    messages?: TicketMessageCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutAuditLogsInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
    messages?: TicketMessageUncheckedCreateNestedManyWithoutTicketInput
    attachments?: TicketAttachmentUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutAuditLogsInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutAuditLogsInput, TicketUncheckedCreateWithoutAuditLogsInput>
  }

  export type TicketingUserCreateWithoutAuditLogsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    organization?: OrganizationCreateNestedOneWithoutUsersInput
    createdTickets?: TicketCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageCreateNestedManyWithoutAuthorInput
    consultantOrganizations?: ConsultantOrganizationCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserUncheckedCreateWithoutAuditLogsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    organizationId?: string | null
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByInput
    assignedTickets?: TicketUncheckedCreateNestedManyWithoutAssignedToInput
    messages?: TicketMessageUncheckedCreateNestedManyWithoutAuthorInput
    consultantOrganizations?: ConsultantOrganizationUncheckedCreateNestedManyWithoutConsultantInput
  }

  export type TicketingUserCreateOrConnectWithoutAuditLogsInput = {
    where: TicketingUserWhereUniqueInput
    create: XOR<TicketingUserCreateWithoutAuditLogsInput, TicketingUserUncheckedCreateWithoutAuditLogsInput>
  }

  export type TicketUpsertWithoutAuditLogsInput = {
    update: XOR<TicketUpdateWithoutAuditLogsInput, TicketUncheckedUpdateWithoutAuditLogsInput>
    create: XOR<TicketCreateWithoutAuditLogsInput, TicketUncheckedCreateWithoutAuditLogsInput>
    where?: TicketWhereInput
  }

  export type TicketUpdateToOneWithWhereWithoutAuditLogsInput = {
    where?: TicketWhereInput
    data: XOR<TicketUpdateWithoutAuditLogsInput, TicketUncheckedUpdateWithoutAuditLogsInput>
  }

  export type TicketUpdateWithoutAuditLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    organization?: OrganizationUpdateOneRequiredWithoutTicketsNestedInput
    createdBy?: TicketingUserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    assignedTo?: TicketingUserUpdateOneWithoutAssignedTicketsNestedInput
    messages?: TicketMessageUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutAuditLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: TicketMessageUncheckedUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketingUserUpsertWithoutAuditLogsInput = {
    update: XOR<TicketingUserUpdateWithoutAuditLogsInput, TicketingUserUncheckedUpdateWithoutAuditLogsInput>
    create: XOR<TicketingUserCreateWithoutAuditLogsInput, TicketingUserUncheckedCreateWithoutAuditLogsInput>
    where?: TicketingUserWhereInput
  }

  export type TicketingUserUpdateToOneWithWhereWithoutAuditLogsInput = {
    where?: TicketingUserWhereInput
    data: XOR<TicketingUserUpdateWithoutAuditLogsInput, TicketingUserUncheckedUpdateWithoutAuditLogsInput>
  }

  export type TicketingUserUpdateWithoutAuditLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneWithoutUsersNestedInput
    createdTickets?: TicketUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUpdateManyWithoutAuthorNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserUncheckedUpdateWithoutAuditLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUncheckedUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUncheckedUpdateManyWithoutAuthorNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserCreateManyOrganizationInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role: $Enums.TicketingUserRole
    consultantVerified?: boolean
    tbosAdminUserId?: string | null
    tbosRole?: string | null
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TicketCreateManyOrganizationInput = {
    id?: string
    ticketNumber: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
  }

  export type ConsultantOrganizationCreateManyOrganizationInput = {
    id?: string
    consultantId: string
    createdAt?: Date | string
  }

  export type TicketingUserUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTickets?: TicketUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserUncheckedUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByNestedInput
    assignedTickets?: TicketUncheckedUpdateManyWithoutAssignedToNestedInput
    messages?: TicketMessageUncheckedUpdateManyWithoutAuthorNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutActorNestedInput
    consultantOrganizations?: ConsultantOrganizationUncheckedUpdateManyWithoutConsultantNestedInput
  }

  export type TicketingUserUncheckedUpdateManyWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumTicketingUserRoleFieldUpdateOperationsInput | $Enums.TicketingUserRole
    consultantVerified?: BoolFieldUpdateOperationsInput | boolean
    tbosAdminUserId?: NullableStringFieldUpdateOperationsInput | string | null
    tbosRole?: NullableStringFieldUpdateOperationsInput | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdBy?: TicketingUserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    assignedTo?: TicketingUserUpdateOneWithoutAssignedTicketsNestedInput
    messages?: TicketMessageUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: TicketMessageUncheckedUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUncheckedUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateManyWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ConsultantOrganizationUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    consultant?: TicketingUserUpdateOneRequiredWithoutConsultantOrganizationsNestedInput
  }

  export type ConsultantOrganizationUncheckedUpdateWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    consultantId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsultantOrganizationUncheckedUpdateManyWithoutOrganizationInput = {
    id?: StringFieldUpdateOperationsInput | string
    consultantId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketCreateManyCreatedByInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    assignedToId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
  }

  export type TicketCreateManyAssignedToInput = {
    id?: string
    ticketNumber: string
    organizationId: string
    type: $Enums.TicketType
    priority?: $Enums.TicketPriority
    status?: $Enums.TicketStatus
    subject: string
    description: string
    createdById: string
    createdAt?: Date | string
    updatedAt?: Date | string
    closedAt?: Date | string | null
  }

  export type TicketMessageCreateManyAuthorInput = {
    id?: string
    ticketId: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type TicketAuditLogCreateManyActorInput = {
    id?: string
    ticketId: string
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ConsultantOrganizationCreateManyConsultantInput = {
    id?: string
    organizationId: string
    createdAt?: Date | string
  }

  export type TicketUpdateWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    organization?: OrganizationUpdateOneRequiredWithoutTicketsNestedInput
    assignedTo?: TicketingUserUpdateOneWithoutAssignedTicketsNestedInput
    messages?: TicketMessageUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: TicketMessageUncheckedUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUncheckedUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateManyWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    assignedToId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TicketUpdateWithoutAssignedToInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    organization?: OrganizationUpdateOneRequiredWithoutTicketsNestedInput
    createdBy?: TicketingUserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    messages?: TicketMessageUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutAssignedToInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: TicketMessageUncheckedUpdateManyWithoutTicketNestedInput
    attachments?: TicketAttachmentUncheckedUpdateManyWithoutTicketNestedInput
    auditLogs?: TicketAuditLogUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateManyWithoutAssignedToInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketNumber?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    type?: EnumTicketTypeFieldUpdateOperationsInput | $Enums.TicketType
    priority?: EnumTicketPriorityFieldUpdateOperationsInput | $Enums.TicketPriority
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    closedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TicketMessageUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: TicketUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type TicketMessageUncheckedUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketMessageUncheckedUpdateManyWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAuditLogUpdateWithoutActorInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: TicketUpdateOneRequiredWithoutAuditLogsNestedInput
  }

  export type TicketAuditLogUncheckedUpdateWithoutActorInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAuditLogUncheckedUpdateManyWithoutActorInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsultantOrganizationUpdateWithoutConsultantInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    organization?: OrganizationUpdateOneRequiredWithoutConsultantOrganizationsNestedInput
  }

  export type ConsultantOrganizationUncheckedUpdateWithoutConsultantInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsultantOrganizationUncheckedUpdateManyWithoutConsultantInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketMessageCreateManyTicketInput = {
    id?: string
    authorId: string
    body: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type TicketAttachmentCreateManyTicketInput = {
    id?: string
    fileName: string
    fileUrl: string
    fileSize?: number | null
    uploadedById: string
    createdAt?: Date | string
  }

  export type TicketAuditLogCreateManyTicketInput = {
    id?: string
    actorId?: string | null
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type TicketMessageUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: TicketingUserUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type TicketMessageUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketMessageUncheckedUpdateManyWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAttachmentUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAttachmentUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAttachmentUncheckedUpdateManyWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    uploadedById?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAuditLogUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    actor?: TicketingUserUpdateOneWithoutAuditLogsNestedInput
  }

  export type TicketAuditLogUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TicketAuditLogUncheckedUpdateManyWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    field?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableStringFieldUpdateOperationsInput | string | null
    newValue?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use OrganizationCountOutputTypeDefaultArgs instead
     */
    export type OrganizationCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = OrganizationCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TicketingUserCountOutputTypeDefaultArgs instead
     */
    export type TicketingUserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TicketingUserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TicketCountOutputTypeDefaultArgs instead
     */
    export type TicketCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TicketCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use OrganizationDefaultArgs instead
     */
    export type OrganizationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = OrganizationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TicketingUserDefaultArgs instead
     */
    export type TicketingUserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TicketingUserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ConsultantOrganizationDefaultArgs instead
     */
    export type ConsultantOrganizationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ConsultantOrganizationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TicketDefaultArgs instead
     */
    export type TicketArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TicketDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TicketMessageDefaultArgs instead
     */
    export type TicketMessageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TicketMessageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TicketAttachmentDefaultArgs instead
     */
    export type TicketAttachmentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TicketAttachmentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TicketAuditLogDefaultArgs instead
     */
    export type TicketAuditLogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TicketAuditLogDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}